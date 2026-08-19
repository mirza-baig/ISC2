import { useEffect, useRef, useCallback } from 'react';
import {
  SESSION_TIMEOUT_CONFIG,
  SESSION_STORAGE_KEYS,
  SESSION_LOCALSTORAGE_KEYS,
} from 'constants/sessionTimeout';

interface UseIdleTimeoutOptions {
  isAuthenticated: boolean;
  onTimeout?: () => void;
}

export function useIdleTimeout({ isAuthenticated, onTimeout }: UseIdleTimeoutOptions): void {
  const lastActivityUpdateRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
      localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);
    }

    if (onTimeout) {
      onTimeout();
    } else {
      // Full navigation so federated logout redirects are followed.
      window.location.assign('/api/auth/federated-sign-out');
    }
  }, [onTimeout]);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();

    if (now - lastActivityUpdateRef.current < SESSION_TIMEOUT_CONFIG.ACTIVITY_DEBOUNCE_MS) {
      return;
    }

    lastActivityUpdateRef.current = now;
    localStorage.setItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY, now.toString());
  }, []);

  const checkInactivity = useCallback(() => {
    const lastActivity = localStorage.getItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);

    if (!lastActivity) {
      updateLastActivity();
      return;
    }

    const activeEl = document.activeElement;
    const fullscreenEl = document.fullscreenElement;

    const isInViewport = (el: Element): boolean => {
      const rect = el.getBoundingClientRect();
      return (
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
    };

    const iframeFocusedAndVisible = activeEl?.tagName === 'IFRAME' && isInViewport(activeEl);
    const iframeFullscreen = fullscreenEl?.tagName === 'IFRAME';
    const brightTalkIframe = document.getElementById('bt-player-wrapper-iframe');
    const isBrightTalkVisible = !!brightTalkIframe && isInViewport(brightTalkIframe);
    const isWatchingIframe = iframeFocusedAndVisible || iframeFullscreen || isBrightTalkVisible;

    if (isWatchingIframe) {
      updateLastActivity();
      return;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    const inactiveTime = now - lastActivityTime;

    if (inactiveTime >= SESSION_TIMEOUT_CONFIG.TIMEOUT_MS) {
      performLogout();
    }
  }, [performLogout, updateLastActivity]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY && event.newValue) {
      lastActivityUpdateRef.current = parseInt(event.newValue, 10);
    }
  }, []);

  const initializeSession = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;

    const isReturningSession = !sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
    const lastActivity = localStorage.getItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);

    if (isReturningSession && lastActivity) {
      const lastActivityTime = parseInt(lastActivity, 10);
      const inactiveTime = Date.now() - lastActivityTime;

      if (inactiveTime >= SESSION_TIMEOUT_CONFIG.TIMEOUT_MS) {
        performLogout();
        return false;
      }
    }

    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE, 'true');
    lastActivityUpdateRef.current = 0;
    updateLastActivity();
    return true;
  }, [updateLastActivity, performLogout]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const sessionValid = initializeSession();
    if (!sessionValid) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener('storage', handleStorageChange);

    checkIntervalRef.current = setInterval(
      checkInactivity,
      SESSION_TIMEOUT_CONFIG.CHECK_INTERVAL_MS
    );

    return () => {
      SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      window.removeEventListener('storage', handleStorageChange);

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [
    isAuthenticated,
    initializeSession,
    updateLastActivity,
    handleStorageChange,
    checkInactivity,
  ]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkInactivity]);
}

export default useIdleTimeout;
