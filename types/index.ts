export type DealType = {
    title: string;
    url: string;
    created: Date;
    last_replied: Date;
    comments: number;
    votes: number;
    views: number;
    category?: string;
  }
  
  export type UserType = {
    id: string;
    username: string;
    email: string;
  }
  
  export type QueryType = {
    id: string;
    name: string;
    keywords: string[];
    categories?: string[];
    intervalMinutes: number;
    webhookUrl: string;
    isActive: boolean;
    lastRun?: Date;
    nextRun: Date;
  }