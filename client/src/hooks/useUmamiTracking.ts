import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import umami from '@/utils/umami';

/**
 * React Hook to track page views on route changes
 * Place this in your App component or Router wrapper
 */
export const useUmamiPageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    umami.trackPageView(location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location]);
};

/**
 * React Hook to track component mount/unmount
 */
export const useUmamiComponentTracking = (componentName: string) => {
  useEffect(() => {
    umami.track(`component:mount`, { component: componentName });

    return () => {
      umami.track(`component:unmount`, { component: componentName });
    };
  }, [componentName]);
};

/**
 * React Hook to track timing/performance
 */
export const useUmamiTiming = (metricName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      umami.trackPerformance(metricName, duration);
    };
  }, [metricName]);
};

export default useUmamiPageTracking;
