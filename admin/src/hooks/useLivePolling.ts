// src/hooks/useLivePolling.ts
import { useEffect, useRef } from 'react';

/**
 * A universal hook to silently poll for fresh data in the background.
 * Automatically cleans itself up when the user navigates away from the page.
 */
export default function useLivePolling(
  fetchFunction: (isSilentBackgroundFetch: boolean) => Promise<void>, 
  intervalMs: number = 15000
) {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Set up the silent interval
    const intervalId = setInterval(() => {
      if (isMounted.current) {
        fetchFunction(true); // true tells your fetch function to hide the loading spinner
      }
    }, intervalMs);

    // CRITICAL: Cleanup function runs when admin navigates to another page
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [fetchFunction, intervalMs]);
}