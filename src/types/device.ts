import { z } from 'zod';

export const publishCommandSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type PublishCommandInput = z.infer<typeof publishCommandSchema>;

export interface SocketPongResponse {
  status: string;
  source: string;
  received: unknown;
  timestamp: string;
}

export interface RealtimeEventLog {
  id: string;
  type: 'socket-ping' | 'socket-pong' | 'error';
  title: string;
  payload: unknown;
  timestamp: string;
  latencyMs?: number;
}
