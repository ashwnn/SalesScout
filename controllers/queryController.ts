import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Query from '@/models/Query';
import { addQueryToScheduler } from '@/services/schedulerService';
import { QueryType } from '@/types';
import { body, validationResult } from 'express-validator';
import validator from 'validator';

/**
 * Validate webhook URL to prevent SSRF attacks
 * Blocks internal/private IP addresses and localhost
 */
const isValidWebhookUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges (IPv4)
    const privateIPv4Patterns = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // Link-local
      /^0\./,                     // 0.0.0.0/8
    ];
    
    for (const pattern of privateIPv4Patterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    // Block link-local IPv6
    if (hostname.startsWith('fe80:') || hostname.startsWith('::ffff:')) {
      return false;
    }
    
    // Block cloud metadata services
    const blockedHosts = [
      '169.254.169.254',  // AWS, Azure, GCP metadata
      'metadata.google.internal',
      'metadata',
    ];
    
    if (blockedHosts.includes(hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Validation rules for creating a query
export const createQueryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query name must be between 1 and 100 characters')
    .escape(),
  body('keywords')
    .isArray({ min: 1 })
    .withMessage('Keywords must be an array with at least one keyword'),
  body('keywords.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each keyword must be between 1 and 50 characters')
    .escape(),
  body('intervalMinutes')
    .isInt({ min: 30 })
    .withMessage('Interval must be at least 30 minutes'),
  body('webhookUrl')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Invalid webhook URL format')
    .custom((value) => {
      if (!isValidWebhookUrl(value)) {
        throw new Error('Webhook URL points to a private/internal address');
      }
      return true;
    }),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .trim()
    .escape()
];

export const createQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array()
      });
      return;
    }

    const { name, keywords, categories, intervalMinutes, webhookUrl } = req.body;
    const userId = (req as any).user.id;
    
    // Set next run time
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);

    const newQuery = new Query({
      userId,
      name,
      keywords,
      categories: categories || [],
      intervalMinutes,
      webhookUrl,
      nextRun
    });

    const savedQuery = await newQuery.save();
    
    // Add to scheduler
    addQueryToScheduler(savedQuery as unknown as QueryType);
    
    const obj: any = savedQuery.toObject();
    res.status(201).json({
      success: true,
      message: 'Query created successfully',
      data: {
        id: obj._id.toString(),
        name: obj.name,
        keywords: obj.keywords,
        categories: obj.categories,
        intervalMinutes: obj.intervalMinutes,
        webhookUrl: obj.webhookUrl,
        isActive: obj.isActive,
        lastRun: obj.lastRun,
        nextRun: obj.nextRun
      }
    });
  } catch (error: any) {
    console.error('Create query error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating query'
    });
  }
};

// Get all queries for the authenticated user
export const getUserQueries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const queries = await Query.find({ userId });
    
    // Manually map to ensure id field is present
    const queriesWithId = queries.map(q => {
      const obj: any = q.toObject();
      return {
        id: obj._id.toString(),
        name: obj.name,
        keywords: obj.keywords,
        categories: obj.categories,
        intervalMinutes: obj.intervalMinutes,
        webhookUrl: obj.webhookUrl,
        isActive: obj.isActive,
        lastRun: obj.lastRun,
        nextRun: obj.nextRun
      };
    });
    
    res.json({
      success: true,
      count: queriesWithId.length,
      data: queriesWithId
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching queries'
    });
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
    
    const obj: any = query.toObject();
    res.json({
      success: true,
      data: {
        id: obj._id.toString(),
        name: obj.name,
        keywords: obj.keywords,
        categories: obj.categories,
        intervalMinutes: obj.intervalMinutes,
        webhookUrl: obj.webhookUrl,
        isActive: obj.isActive,
        lastRun: obj.lastRun,
        nextRun: obj.nextRun
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching query'
    });
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

    // Validate webhook URL if provided
    if (webhookUrl && !isValidWebhookUrl(webhookUrl)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook URL or points to private/internal address'
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
      
      const obj: any = query.toObject();
      res.json({
        success: true,
        data: {
          id: obj._id.toString(),
          name: obj.name,
          keywords: obj.keywords,
          categories: obj.categories,
          intervalMinutes: obj.intervalMinutes,
          webhookUrl: obj.webhookUrl,
          isActive: obj.isActive,
          lastRun: obj.lastRun,
          nextRun: obj.nextRun
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'Query not found after update' });
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating query'
    });
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
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting query'
    });
  }
};