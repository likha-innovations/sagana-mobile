import { tokenCache } from './token-cache';
import { logger } from './logger';

type TokenGetter = () => Promise<string | null | undefined>;

let activeTokenGetter: TokenGetter | null = null;

// Register dynamic auth token provider (Clerk useAuth)
export function setAuthTokenGetter(getter: TokenGetter | null): void {
  activeTokenGetter = getter;
}

// Resolve active JWT Bearer token from Clerk session or SecureStore fallback
export async function getAuthToken(): Promise<string | null> {
  let token: string | null = null;

  if (activeTokenGetter) {
    try {
      const dynamicToken = await activeTokenGetter();
      if (dynamicToken) {
        token = dynamicToken;
      }
    } catch (err) {
      logger.warn('Failed to retrieve token from activeTokenGetter', 'AuthToken', err);
    }
  }

  if (!token) {
    try {
      const cachedToken = await tokenCache.getToken('__clerk_client_jwt');
      if (cachedToken) {
        token = cachedToken;
      }
    } catch (err) {
      logger.error('Failed to retrieve token from SecureStore', err, 'AuthToken');
    }
  }

  if (token) {
    logger.info(`[JWT TOKEN] ${token}`, 'AuthToken');
  } else {
    logger.warn('No active JWT token found in session or storage', 'AuthToken');
  }

  return token;
}
