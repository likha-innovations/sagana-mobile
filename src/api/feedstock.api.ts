import { api } from './client';
import { feedstockSchema, type Feedstock } from '@/types/batch';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FeedstockAPI');

export interface FeedstockResponse {
  id: string;
  name: string;
  category: 'green' | 'brown';
  description?: string | null;
  status: 'active' | 'inactive';
}

function toFeedstock(record: FeedstockResponse): Feedstock {
  return feedstockSchema.parse({
    feedstock_id: record.id,
    name: record.name,
    category: record.category,
    description: record.description,
    status: record.status,
  });
}

export const feedstockApi = {
  getFeedstocks: async (): Promise<Feedstock[]> => {
    // Public endpoint: withAuth false skips redundant JWT resolution
    const records = await api.get<FeedstockResponse[]>('/feedstocks', { withAuth: false });
    logger.info(`Fetched ${records.length} feedstocks from backend`, records);
    const parsed = records.map(toFeedstock);
    logger.info(`Successfully parsed ${parsed.length} feedstocks`, parsed);
    return parsed;
  },
};

