const DEFAULT_TIMEOUT_MINUTES = 30;

const getTimeoutMs = (): number => {
  const envTimeout = process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES;
  const minutes = envTimeout ? parseInt(envTimeout, 10) : DEFAULT_TIMEOUT_MINUTES;
  return (isNaN(minutes) ? DEFAULT_TIMEOUT_MINUTES : minutes) * 60 * 1000;
};

export const SESSION_TIMEOUT_CONFIG = {
  TIMEOUT_MS: getTimeoutMs(),
  CHECK_INTERVAL_MS: 60 * 1000,
  ACTIVITY_DEBOUNCE_MS: 30 * 1000,
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const,
};

export const SESSION_STORAGE_KEYS = {
  SESSION_ACTIVE: 'isc2-session-active',
};

export const SESSION_LOCALSTORAGE_KEYS = {
  LAST_ACTIVITY: 'isc2-last-activity',
};
