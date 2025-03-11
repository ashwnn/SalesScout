import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Query from '@/models/Query';
import { addQueryToScheduler } from '@/services/schedulerService';
import { QueryType } from '@/types';

export const createQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, keywords, categories, intervalMinutes, webhookUrl } = req.body;
    
    // Validate minimum interval
    if (intervalMinutes < 30) {
      res.status(400).json({ 
        success: false, 
        message: 'Query interval must be at least 30 minutes'
      });
      return;
    }

    const userId = (req as any).user.id;
    
    // Set next run time
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);

    const newQuery = new Query({
      userId,
      name,
      keywords,
      categories,
      intervalMinutes,
      webhookUrl,
      nextRun
    });

    const savedQuery = await newQuery.save();
    
    // Add to scheduler
    addQueryToScheduler(savedQuery as unknown as QueryType);
    
    res.status(201).json({
      success: true,
      data: savedQuery
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all queries for the authenticated user
export const getUserQueries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const queries = await Query.find({ userId });
    
    res.json({
      success: true,
      count: queries.length,
      data: queries
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific query
export const getQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const queryId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      res.status(400).json({ success: false, message: 'Invalid query ID' });
      return;
    }

    const query = await Query.findOne({ _id: queryId, userId });
    
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }
    
    res.json({
      success: true,
      data: query
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a query
export const updateQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const queryId = req.params.id;
    const { name, keywords, categories, intervalMinutes, webhookUrl, isActive } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      res.status(400).json({ success: false, message: 'Invalid query ID' });
      return;
    }
    
    // Validate minimum interval if included
    if (intervalMinutes && intervalMinutes < 30) {
      res.status(400).json({ 
        success: false, 
        message: 'Query interval must be at least 30 minutes'
      });
      return;
    }

    // Find and update query
    let query = await Query.findOne({ _id: queryId, userId });
    
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    // Update next run time if interval is changed
    let nextRun = query.nextRun;
    if (intervalMinutes && intervalMinutes !== query.intervalMinutes) {
      nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);
    }

    query = await Query.findByIdAndUpdate(
      queryId,
      {
        name: name || query.name,
        keywords: keywords || query.keywords,
        categories: categories || query.categories,
        intervalMinutes: intervalMinutes || query.intervalMinutes,
        webhookUrl: webhookUrl || query.webhookUrl,
        isActive: isActive !== undefined ? isActive : query.isActive,
        nextRun
      },
      { new: true }
    );

    // Update scheduler
    if (query) {
      addQueryToScheduler(query as unknown as QueryType);
    }
    
    res.json({
      success: true,
      data: query
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a query
export const deleteQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const queryId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      res.status(400).json({ success: false, message: 'Invalid query ID' });
      return;
    }

    const query = await Query.findOneAndDelete({ _id: queryId, userId });
    
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }
    
    res.json({
      success: true,
      message: 'Query deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};