import { Request, Response } from 'express';
import Deal from '@/models/Deal';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { DealType } from '@/types';

export const scrapeRedFlagDeals = async () => {
  try {
    console.log('🔍 Scraping RedFlagDeals for new deals...');

    const response = await axios.get('https://forums.redflagdeals.com/hot-deals-f9/?sk=pv&rfd_sk=pv&sd=d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    if (!response || !response.data) {
      console.error('❌ No response data received from RedFlagDeals');
      return [];
    }

    const $ = cheerio.load(response.data);
    const scrapedDeals: DealType[] = [];

    $('.thread_info').each((index, element) => {
      try {
        const titleElement = $(element).find('.thread_title a');
        const title = titleElement.text().trim();
        
        if (!title) return; // Skip if no title found
        
        const relativeUrl = titleElement.attr('href');
        const url = relativeUrl ? `https://forums.redflagdeals.com${relativeUrl}` : '';

        if (!url) return; // Skip if no URL found

        const votesText = $(element).find('.thread_stats .vote_count').text().trim();
        const votes = parseInt(votesText) || 0;

        const viewsText = $(element).find('.thread_stats .thread_views').text().trim().replace(/[^\d]/g, '');
        const views = parseInt(viewsText) || 0;

        const commentsText = $(element).find('.thread_stats .thread_replies').text().trim().replace(/[^\d]/g, '');
        const comments = parseInt(commentsText) || 0;

        let category = $(element).find('.thread_category').text().trim();
        if (!category) {
          category = 'Other';
        }

        let created = new Date();
        const createdElement = $(element).find('.author_info time');
        if (createdElement.length) {
          const dateTimeAttr = createdElement.attr('datetime');
          if (dateTimeAttr) {
            created = new Date(dateTimeAttr);
          }
        }

        let last_replied = new Date();
        const lastRepliedText = $(element).find('.last_post time');
        if (lastRepliedText.length) {
          const dateTimeAttr = lastRepliedText.attr('datetime');
          if (dateTimeAttr) {
            last_replied = new Date(dateTimeAttr);
          }
        }

        const deal: DealType = {
          title,
          url,
          votes,
          views,
          comments,
          created,
          last_replied,
          category
        };

        scrapedDeals.push(deal);
      } catch (err: any) {
        console.error('⚠️ Error parsing individual deal:', err.message);
      }
    });

    if (scrapedDeals.length === 0) {
      console.warn('⚠️ No deals found during scraping. Site structure may have changed.');
      return [];
    }

    const savedDeals = [];

    for (const deal of scrapedDeals) {
      try {
        const existingDeal = await Deal.findOne({ url: deal.url });

        if (!existingDeal) {
          const newDeal = new Deal(deal);
          const savedDeal = await newDeal.save();
          savedDeals.push(savedDeal);
        }
      } catch (saveError: any) {
        console.error(`⚠️ Error saving deal "${deal.title}":`, saveError.message);
      }
    }

    console.log(`✅ Scraping complete. Found ${scrapedDeals.length} deals, saved ${savedDeals.length} new deals.`);
    return savedDeals;
  } catch (error: any) {
    console.error('❌ Error in scrapeRedFlagDeals:', error.message);
    throw error;
  }
};

export const getDeals = async (req: Request, res: Response) => {
  try {
    const { category, search, limit, sort } = req.query;
    
    // Build filter
    const filter: any = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Parse limit
    const limitNum = limit ? parseInt(limit as string) : 100;
    
    // Parse sort
    let sortOption: any = { created: -1 }; // Default: newest first
    if (sort === 'votes') sortOption = { votes: -1 };
    if (sort === 'views') sortOption = { views: -1 };
    if (sort === 'comments') sortOption = { comments: -1 };
    
    const deals = await Deal.find(filter)
      .sort(sortOption)
      .limit(limitNum);
      
    res.json(deals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching deals',
      error: error.message 
    });
  }
};

export const triggerScrape = async (req: Request, res: Response) => {
  try {
    const deals = await scrapeRedFlagDeals();
    res.json({ 
      success: true,
      message: `Successfully scraped ${deals.length} new deals`,
      count: deals.length,
      deals
    });
  } catch (error: any) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error triggering scrape',
      error: error.message
    });
  }
};