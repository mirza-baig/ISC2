// Source: https://github.com/nas5w/use-local-storage/blob/main/src/index.ts

import { useEffect, useMemo, useRef, useState } from 'react';

type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

type Options<T> = Partial<{
  serializer: Serializer<T>;
  parser: Parser<T>;
  logger: (error: unknown) => void;
  syncData: boolean;
}>;

const useLocalStorage = <T>(
  key: string,
  defaultValue?: T,
  options?: Options<T>
): [T | undefined, Setter<T>] => {
  const opts = useMemo(
    () => ({
      serializer: JSON.stringify,
      parser: JSON.parse,
      logger: console.log,
      syncData: false,
      ...options,
    }),
    [options]
  );

  const { serializer, parser, logger, syncData } = opts;

  const rawValueRef = useRef<string | null>(null);

  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      rawValueRef.current = window.localStorage.getItem(key);
      const res: T = rawValueRef.current ? parser(rawValueRef.current) : defaultValue;
      return res;
    } catch (e) {
      logger(e);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateLocalStorage = () => {
      // Browser ONLY dispatch storage events to other tabs, NOT current tab.
      // We need to manually dispatch storage event for current tab

      const commonEvtPayload = {
        storageArea: window.localStorage,
        url: window.location.href,
        key,
      };

      if (value !== undefined) {
        const newValue = serializer(value);
        const oldValue = rawValueRef.current;
        rawValueRef.current = newValue;
        window.localStorage.setItem(key, newValue);
        window.dispatchEvent(
          new StorageEvent('storage', {
            ...commonEvtPayload,
            newValue,
            oldValue,
          })
        );
      } else {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new StorageEvent('storage', commonEvtPayload));
      }
    };

    try {
      updateLocalStorage();
    } catch (e) {
      logger(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- watch only specific data
  }, [value]);

  useEffect(() => {
    if (!syncData) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== window.localStorage) {
        return;
      }

      try {
        if (e.newValue !== rawValueRef.current) {
          rawValueRef.current = e.newValue;
          setValue(e.newValue ? parser(e.newValue) : undefined);
        }
      } catch (error) {
        logger(error);
      }
    };

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', handleStorageChange);

    // eslint-disable-next-line consistent-return -- useEffect cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- watch only specific data
  }, [key, syncData]);

  return [value, setValue];
};

export default useLocalStorage;
