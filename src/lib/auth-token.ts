import { tokenCache } from './token-cache';
import { createLogger } from './logger';

const logger = createLogger('AuthToken');

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
      logger.warn('Failed to retrieve token from activeTokenGetter', err);
    }
  }

  if (!token) {
    try {
      const cachedToken = await tokenCache.getToken('__clerk_client_jwt');
      if (cachedToken) {
        token = cachedToken;
      }
    } catch (err) {
      logger.error('Failed to retrieve token from SecureStore', err);
    }
  }

  if (token) {
    logger.info(`Resolved active JWT token: ${token}`);
  } else {
    logger.warn('No active JWT token found in session or storage');
  }

  return token;
}
