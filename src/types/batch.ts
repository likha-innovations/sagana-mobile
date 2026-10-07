import { z } from 'zod';

export const feedstockCategorySchema = z.enum(['Greens', 'Browns']);
export type FeedstockCategory = z.infer<typeof feedstockCategorySchema>;

export const feedstockSchema = z.object({
  feedstock_id: z.string(),
  name: z.string(),
  category: feedstockCategorySchema,
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});
export type Feedstock = z.infer<typeof feedstockSchema>;

// Embedded feedstock item within compost batch
export const batchFeedstockSchema = z.object({
  id: z.string(),
  feedstock_id: z.string(),
  name: z.string(),
  category: feedstockCategorySchema,
  weight_kg: z.number().positive(),
});
export type BatchFeedstock = z.infer<typeof batchFeedstockSchema>;

// Backend-aligned domain model: CompostBatch with embedded feedstocks
export const compostBatchSchema = z.object({
  batch_id: z.string(),
  machine_id: z.string(),
  user_id: z.string().optional(),
  batch_code: z.string(),
  status: z.enum(['active', 'completed', 'failed', 'cancelled']).default('active'),
  start_date: z.string(),
  completion_date: z.string().nullable().optional(),
  total_weight: z.number().nonnegative(),
  feedstocks: z.array(batchFeedstockSchema),
});
export type CompostBatch = z.infer<typeof compostBatchSchema>;

// Form validation schemas for batch creation wizard
export const createBatchItemInputSchema = z.object({
  feedstock_id: z.string(),
  weight: z.number().positive('Weight must be greater than 0'),
});
export type CreateBatchItemInput = z.infer<typeof createBatchItemInputSchema>;

export const createBatchInputSchema = z.object({
  machine_id: z.string().min(1, 'Please select a machine'),
  feedstocks: z.array(createBatchItemInputSchema).min(1, 'Please select at least one feedstock'),
});
export type CreateBatchInput = z.infer<typeof createBatchInputSchema>;

export const dashboardMetricsSchema = z.object({
  totalCompost: z.object({ value: z.number(), unit: z.string().default('kg') }),
  totalGreens: z.object({ value: z.number(), unit: z.string().default('kg') }),
  totalBrowns: z.object({ value: z.number(), unit: z.string().default('kg') }),
});
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

