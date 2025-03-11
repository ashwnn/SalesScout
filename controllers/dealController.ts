import { Request, Response } from 'express';
import Deal from '@/models/Deal';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { DealType } from '@/types';

export const scrapeRedFlagDeals = async () => {
  try {
    console.log('Scraping RedFlagDeals for new deals...');

    const response = await axios.get('https://forums.redflagdeals.com/hot-deals-f9/?sk=pv&rfd_sk=pv&sd=d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response || !response.data) {
      console.error('No response data received from RedFlagDeals');
      return [];
    }

    const $ = cheerio.load(response.data);

    const scrapedDeals: DealType[] = [];

    $('.thread_info').each((index, element) => {
      try {
        const titleElement = $(element).find('.thread_title a');
        const title = titleElement.text().trim();
        const relativeUrl = titleElement.attr('href');
        const url = relativeUrl ? `https://forums.redflagdeals.com${relativeUrl}` : '';

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
      } catch (err) {
        console.error('Error parsing individual deal:', err);
      }
    });

    const savedDeals = [];

    for (const deal of scrapedDeals) {
      const existingDeal = await Deal.findOne({ url: deal.url });

      if (!existingDeal) {
        const newDeal = new Deal(deal);
        const savedDeal = await newDeal.save();
        savedDeals.push(savedDeal);
      }
    }

    console.log(`Scraping complete. Found ${scrapedDeals.length} deals, saved ${savedDeals.length} new deals.`);
    return savedDeals;
  } catch (error) {
    console.error('Error in scrapeRedFlagDeals:', error);
    throw error;
  }
};

export const getDeals = async (req: Request, res: Response) => {
  try {
    const deals = await Deal.find().sort({ created: -1 });
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const triggerScrape = async (req: Request, res: Response) => {
  try {
    const deals = await scrapeRedFlagDeals();
    res.json({ message: `Successfully scraped ${deals.length} new deals` });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({ message: 'Error triggering scrape' });
  }
};