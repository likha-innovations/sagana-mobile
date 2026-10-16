import { api } from './client';
import { feedstockSchema, type Feedstock } from '@/types/batch';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FeedstockAPI');

export const feedstockApi = {
  getFeedstocks: async (): Promise<Feedstock[]> => {
    const records = await api.get<Feedstock[]>('/feedstocks', { withAuth: false });
    logger.info(`Fetched ${records.length} feedstocks from backend`, records);
    const parsed = records.map((record) => feedstockSchema.parse(record));
    logger.info(`Successfully parsed ${parsed.length} feedstocks`, parsed);
    return parsed;
  },
};

