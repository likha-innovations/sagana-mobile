/**
 * Standard Backend Response Envelope
 * Matches NestJS standard response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Standard Backend Error Response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp?: string;
}

/**
 * Structured API Error class thrown by apiFetch
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}
