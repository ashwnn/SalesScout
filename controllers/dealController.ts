import { Request, Response } from "express";
import Deal from "@/models/Deal";
import * as cheerio from "cheerio";
import axios from "axios";
import { DealType } from "@/types";

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Notes:
 * - Targets the Trending view structure: /hot-deals-f9/trending/
 * - Selects only <li class="topic"> to avoid ads and other containers
 * - Reads stats from either inner or outer footers, whichever is present
 * - Normalizes relative URLs and images
 * - Uses bulkWrite upserts to avoid N DB calls and keep stats fresh
 * - Safe number parsing for negatives and formatted numbers
 */

const BASE_URL = "https://forums.redflagdeals.com";
const LIST_URL = `${BASE_URL}/hot-deals-f9/trending/`;

const toAbs = (maybeRel?: string) =>
  maybeRel ? new URL(maybeRel, BASE_URL).toString() : "";

const parseIntSafe = (txt: string): number => {
  // keep possible leading minus, drop other non-digits
  const m = txt.replace(/[^0-9-]+/g, "");
  if (m === "" || m === "-") return 0;
  const n = parseInt(m, 10);
  return Number.isFinite(n) ? n : 0;
};

const text = ($el: cheerio.Cheerio<any>) => $el.text().trim();

const getFirst = ($root: cheerio.Cheerio<any>, selector: string) =>
  $root.find(selector).first();

const readDate = ($root: cheerio.Cheerio<any>, selector: string): Date | null => {
  const t = getFirst($root, selector);
  const iso = t.attr("datetime");
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const extractStats = ($topic: cheerio.Cheerio<any>) => {
  // prefer inner footer, fallback to outer footer
  const $inner = $topic.find(".thread_info .thread_inner_footer");
  const $outer = $topic.find(".thread_outer_footer");
  const $src = $inner.length ? $inner : $outer;

  const votes = parseIntSafe(text(getFirst($src, ".votes.thread_stat span")));
  const comments = parseIntSafe(text(getFirst($src, ".posts.thread_stat span")));
  const views = parseIntSafe(text(getFirst($src, ".views.thread_stat")));

  // last replied from the block with .last_post time where available
  const lastReplied =
    readDate($src, ".last_post time") ??
    readDate($topic, ".last_post time") ??
    null;

  return { votes, comments, views, lastReplied };
};

export const scrapeRedFlagDeals = async () => {
  try {
    console.log("Scraping RedFlagDeals Trending...");

    const response = await axios.get(LIST_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        Referer: `${BASE_URL}/hot-deals-f9/`,
        "Cache-Control": "no-cache",
      },
      // gzip/deflate handled automatically by axios
      timeout: 20000,
      validateStatus: (s) => s >= 200 && s < 400,
      // follow redirects if the forum moves you between list variants
      maxRedirects: 3,
    });

    if (!response?.data) {
      console.error("No response data received from RedFlagDeals");
      return [];
    }

    const $ = cheerio.load(response.data);

    const topics = $("ul.topiclist.topics li.topic");
    if (!topics.length) {
      console.warn("No <li.topic> items found. The site structure may have changed.");
      return [];
    }

    const seen = new Set<string>();
    const scrapedDeals: DealType[] = [];

    topics.each((_, li) => {
      try {
        const $topic = $(li);
        const threadId = $topic.attr("data-thread-id")?.trim();

        const $titleA = $topic.find("h3.thread_title a.thread_title_link").first();
        const title = text($titleA);
        const url = toAbs($titleA.attr("href"));

        if (!title || !url) return;

        // dedupe by URL in case the page renders multiple stat blocks
        if (seen.has(url)) return;
        seen.add(url);

        const category =
          text($topic.find(".thread_inner_header .thread_category").first()) || "Other";

        const dealer =
          text($topic.find(".thread_inner_header .thread_dealer span").first()) || undefined;

        const savings =
          text($topic.find(".thread_inner_header .savings").first()) || undefined;

        const created =
          readDate($topic, ".thread_outer_header .author_info time") ??
          readDate($topic, ".thread_inner_footer .author_info time") ??
          null;

        const { votes, comments, views, lastReplied } = extractStats($topic);

        const imageSrc = toAbs($topic.find(".thread_image img").attr("src"));

        const deal: DealType = {
          title,
          url,
          votes,
          views,
          comments,
          created: created ?? new Date(),
          last_replied: lastReplied ?? new Date(),
          category,
          // keep extras if your schema supports them
          // @ts-ignore optional fields
          dealer,
          // @ts-ignore optional fields
          savings,
          // @ts-ignore optional fields
          thread_id: threadId,
          // @ts-ignore optional fields
          image: imageSrc,
        };

        scrapedDeals.push(deal);
      } catch (err: any) {
        console.error("Error parsing a topic item:", err?.message || err);
      }
    });

    if (!scrapedDeals.length) {
      console.warn("Parsed zero deals from page.");
      return [];
    }

    // Upsert in bulk: insert new items, refresh rolling stats on existing
    // Suggestion on your Mongoose schema:
    // DealSchema.index({ url: 1 }, { unique: true });
    const ops = scrapedDeals.map((d) => ({
      updateOne: {
        filter: { url: d.url },
        update: {
          $setOnInsert: {
            title: d.title,
            url: d.url,
            created: d.created,
          },
          $set: {
            // keep these current
            votes: d.votes,
            views: d.views,
            comments: d.comments,
            last_replied: d.last_replied,
            category: d.category,
            ...(d as any).dealer ? { dealer: (d as any).dealer } : {},
            ...(d as any).savings ? { savings: (d as any).savings } : {},
            ...(d as any).thread_id ? { thread_id: (d as any).thread_id } : {},
            ...(d as any).image ? { image: (d as any).image } : {},
          },
        },
        upsert: true,
      },
    }));

    const result = await Deal.bulkWrite(ops, { ordered: false });

    // Gather newly inserted ids and return the new docs
    const upsertedIds: string[] = Object.values(result.upsertedIds || {}) as any[];
    const savedDeals = upsertedIds.length
      ? await Deal.find({ _id: { $in: upsertedIds } }).lean()
      : [];

    console.log(
      `Scraping complete. Parsed ${scrapedDeals.length} topics, inserted ${savedDeals.length}, matched ${result.matchedCount}.`
    );

    return savedDeals;
  } catch (error: any) {
    console.error("Error in scrapeRedFlagDeals:", error?.message || error);
    throw error;
  }
};

/* Optional polish for your existing endpoints */

export const getDeals = async (req: Request, res: Response) => {
  try {
    const { category, search, limit, sort, page } = req.query;

    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      const q = String(search);
      // Escape special regex characters to prevent ReDoS attacks
      const escapedQuery = escapeRegex(q);
      // Limit search query length to prevent abuse
      if (escapedQuery.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Search query too long (max 100 characters)'
        });
        return;
      }
      filter.$or = [
        { title: { $regex: escapedQuery, $options: "i" } },
        { description: { $regex: escapedQuery, $options: "i" } },
        { dealer: { $regex: escapedQuery, $options: "i" } },
      ];
    }

    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit || 100), 10) || 100));
    const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    const sortMap: Record<string, any> = {
      created: { created: -1 },
      votes: { votes: -1 },
      views: { views: -1 },
      comments: { comments: -1 },
      last_replied: { last_replied: -1 },
    };
    const sortOption = sortMap[String(sort || "created")] || sortMap.created;

    const deals = await Deal.find(filter).sort(sortOption).skip(skip).limit(limitNum).lean();

    res.json({
      success: true,
      page: pageNum,
      count: deals.length,
      deals,
    });
  } catch (error: any) {
    console.error("Error fetching deals:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deals"
    });
  }
};

export const triggerScrape = async (_req: Request, res: Response) => {
  try {
    const deals = await scrapeRedFlagDeals();
    res.json({
      success: true,
      message: `Successfully scraped ${deals.length} new deals`,
      count: deals.length,
      deals,
    });
  } catch (error: any) {
    console.error("Error triggering scrape:", error);
    res.status(500).json({
      success: false,
      message: "Error triggering scrape"
    });
  }
};
