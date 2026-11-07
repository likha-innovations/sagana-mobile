import { createLogger } from './logger';

const logger = createLogger('AuthToken');

type TokenGetter = () => Promise<string | null | undefined>;

let activeTokenGetter: TokenGetter | null = null;
let resolveGetterReady: ((getter: TokenGetter) => void) | null = null;
let getterReadyPromise: Promise<TokenGetter> | null = null;

function resetReadyPromise() {
  getterReadyPromise = new Promise<TokenGetter>((resolve) => {
    resolveGetterReady = resolve;
  });
}

// Initialize on module load
resetReadyPromise();

// Register dynamic auth token provider (Clerk useAuth)
export function setAuthTokenGetter(getter: TokenGetter | null): void {
  activeTokenGetter = getter;
  if (getter && resolveGetterReady) {
    resolveGetterReady(getter);
  } else if (!getter) {
    resetReadyPromise();
  }
}

// Awaits getter registration during cold starts (up to timeoutMs)
async function waitForTokenGetter(timeoutMs = 3000): Promise<TokenGetter | null> {
  if (activeTokenGetter) return activeTokenGetter;
  if (!getterReadyPromise) return null;

  return Promise.race([
    getterReadyPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// Resolve active JWT Bearer token from Clerk session
export async function getAuthToken(): Promise<string | null> {
  const getter = await waitForTokenGetter(3000);
  if (!getter) {
    logger.warn('Auth token getter not ready or user is signed out');
    return null;
  }

  try {
    const token = await getter();
    if (token) {
      logger.debug('Resolved active JWT token from Clerk');
      return token;
    }
  } catch (err) {
    logger.warn('Failed to retrieve token from Clerk activeTokenGetter', err);
  }

  logger.warn('No active JWT token returned by Clerk session');
  return null;
}
