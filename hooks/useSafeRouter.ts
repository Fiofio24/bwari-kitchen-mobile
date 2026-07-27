import { useRouter } from 'expo-router';
import { useRef } from 'react';

export function useSafeRouter() {
  const router = useRouter();
  const isNavigating = useRef(false);

  const safePush = (href: any) => {
    if (isNavigating.current) return;
    
    // Lock the router
    isNavigating.current = true;
    
    // Navigate
    router.push(href);
    
    // Unlock after the screen transition finishes (800ms)
    setTimeout(() => {
      isNavigating.current = false;
    }, 800);
  };

  // Return the router, but replace the default 'push' with our protected 'safePush'
  return {
    ...router,
    push: safePush,
  };
}