import Query from '@/models/Query';
import { DealModel } from '@/models/Deal';
import axios from 'axios';
import { QueryType } from '@/types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Scheduler');
const activeJobs: { [key: string]: NodeJS.Timeout } = {};

export const initializeScheduler = async (): Promise<void> => {
  try {
    logger.info('Initializing query scheduler...');

    const activeQueries = await Query.find({ isActive: true });

    activeQueries.forEach(query => {
      addQueryToScheduler({
        ...query.toObject(),
        _id: (query as any)._id.toString()
      } as QueryType);
    });

    logger.info(`Scheduled ${activeQueries.length} active queries`);
  } catch (error) {
    logger.error('Error initializing scheduler:', error);
  }
};

export const addQueryToScheduler = (query: QueryType): void => {
  // Clear existing job if present
  if (activeJobs[query._id]) {
    clearTimeout(activeJobs[query._id]);
    delete activeJobs[query._id];
  }

  // Skip scheduling if query is inactive
  if (!query.isActive) {
    logger.debug(`Query ${query._id} is inactive, not scheduling`);
    return;
  }

  // Calculate delay until next run
  const now = new Date();
  const nextRun = new Date(query.nextRun);
  let delay = nextRun.getTime() - now.getTime();

  // If next run is in the past, run immediately
  if (delay < 0) {
    delay = 0;
  }

  logger.info(`Scheduling query ${query._id} to run in ${Math.round(delay / 1000 / 60)} minutes`);

  // Schedule the job
  activeJobs[query._id] = setTimeout(() => executeQuery(query._id), delay);
};

// Execute a scheduled query
const executeQuery = async (queryId: string): Promise<void> => {
  try {
    // Get the query
    const query = await Query.findById(queryId);

    if (!query || !query.isActive) {
      logger.warn(`Query ${queryId} not found or inactive, removing from scheduler`);
      return;
    }

    logger.info(`Executing query: ${query.name} (ID: ${queryId})`);
    const startTime = Date.now();

    // Build filter for MongoDB query
    const filter: any = {};
    const conditions: any[] = [];

    // Add keyword search - search in both title and description
    if (query.keywords && query.keywords.length > 0) {
      const keywordConditions = query.keywords.map(keyword => ({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ]
      }));
      
      // Match ANY keyword (OR condition)
      conditions.push({ $or: keywordConditions });
    }

    // Add categories if specified
    if (query.categories && query.categories.length > 0 && query.categories[0] !== '') {
      conditions.push({ category: { $in: query.categories } });
    }

    // Combine conditions with AND
    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    // Get last run time or use a default (1 hour ago)
    const lastRun = query.lastRun || new Date(Date.now() - 60 * 60 * 1000);

    // Find deals matching the filter and created after last run
    const matchingDeals = await DealModel.find({
      ...filter,
      created: { $gte: lastRun }
    }).sort({ created: -1 });

    const executionTime = Date.now() - startTime;
    logger.debug(`Query ${queryId} execution took ${executionTime}ms, found ${matchingDeals.length} deals`);

    // If we have matching deals, send webhook notification
    if (matchingDeals.length > 0) {
      try {
        await axios.post(query.webhookUrl, {
          queryName: query.name,
          queryId: query._id,
          matchCount: matchingDeals.length,
          matches: matchingDeals.map(deal => ({
            id: deal.id,
            title: deal.title,
            url: deal.url,
            created: deal.created,
            votes: deal.votes,
            views: deal.views,
            comments: deal.comments,
            category: deal.category
          }))
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        logger.info(`Sent webhook notification for query "${query.name}" with ${matchingDeals.length} matches`);
      } catch (webhookError: any) {
        logger.error(`Failed to send webhook for query "${query.name}":`, webhookError.message);
      }
    } else {
      logger.debug(`No new matches found for query "${query.name}"`);
    }

    // Update last run time and set next run time
    const now = new Date();
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + query.intervalMinutes);

    await Query.findByIdAndUpdate(query._id, {
      lastRun: now,
      nextRun: nextRun
    });

    // Re-schedule the query for its next run
    addQueryToScheduler({
      ...query.toObject(),
      _id: (query as any)._id.toString(),
      lastRun: now,
      nextRun: nextRun
    } as QueryType);

  } catch (error) {
    logger.error(`Error executing query ${queryId}:`, error);

    // Re-schedule the query even if it failed
    try {
      const query = await Query.findById(queryId);
      if (query && query.isActive) {
        const nextRun = new Date();
        nextRun.setMinutes(nextRun.getMinutes() + query.intervalMinutes);

        await Query.findByIdAndUpdate(query._id, {
          nextRun
        });

        addQueryToScheduler({
          ...query.toObject(),
          _id: (query as any)._id.toString(),
          nextRun
        } as QueryType);
      }
    } catch (rescheduleError) {
      logger.error(`Failed to reschedule query ${queryId}:`, rescheduleError);
    }
  }
};

// Remove a query from the scheduler
export const removeQueryFromScheduler = (queryId: string): void => {
  if (activeJobs[queryId]) {
    clearTimeout(activeJobs[queryId]);
    delete activeJobs[queryId];
    logger.info(`Query ${queryId} removed from scheduler`);
  }
};