import { useContext } from 'react';
import AuthContext from '@/context/AuthContext';
import {
  trackButton as umamiTrackButton,
  trackDemoMode as umamiTrackDemoMode,
  trackQuery,
  trackDeal,
  trackAuth,
  trackInteraction,
  trackError,
  trackPerformance,
  trackSession,
} from '@/utils/umami';

/**
 * Custom hook for analytics tracking with automatic demo mode detection
 * 
 * This hook provides convenient tracking functions that automatically
 * include session type (demo vs regular) and other context.
 * 
 * @example
 * ```tsx
 * const analytics = useAnalytics();
 * 
 * // Track a button click
 * analytics.trackButton('save-query', { queryId: '123' });
 * 
 * // Track a demo-specific action
 * analytics.trackDemo('tried-to-save', { feature: 'query' });
 * ```
 */
export const useAnalytics = () => {
  const { user } = useContext(AuthContext);
  const sessionType = user?.isDemo ? 'demo' : 'regular';
  const isDemo = user?.isDemo || false;

  /**
   * Track a button click with automatic session context
   */
  const trackButton = (buttonName: string, additionalProps?: Record<string, any>) => {
    umamiTrackButton(buttonName, {
      sessionType,
      username: user?.username,
      ...additionalProps,
    });

    // Also track demo-specific event if in demo mode
    if (isDemo) {
      umamiTrackDemoMode(`button-${buttonName}`, additionalProps);
    }
  };

  /**
   * Track a demo mode specific action
   */
  const trackDemo = (action: string, additionalProps?: Record<string, any>) => {
    if (isDemo) {
      umamiTrackDemoMode(action, {
        username: user?.username,
        ...additionalProps,
      });
    }
  };

  /**
   * Track link clicks
   */
  const trackLink = (linkName: string, destination: string, additionalProps?: Record<string, any>) => {
    trackButton(`link-${linkName}`, {
      destination,
      ...additionalProps,
    });
  };

  /**
   * Track form submissions
   */
  const trackForm = (formName: string, success: boolean, additionalProps?: Record<string, any>) => {
    trackInteraction('form-submit', {
      formName,
      success,
      sessionType,
      ...additionalProps,
    });

    if (isDemo) {
      trackDemo(`form-${formName}`, { success, ...additionalProps });
    }
  };

  /**
   * Track navigation between pages
   */
  const trackNavigation = (from: string, to: string) => {
    trackButton('navigate', {
      from,
      to,
    });
  };

  /**
   * Track feature usage
   */
  const trackFeature = (featureName: string, action: string, additionalProps?: Record<string, any>) => {
    trackInteraction('button-click', {
      feature: featureName,
      action,
      sessionType,
      ...additionalProps,
    });

    if (isDemo) {
      trackDemo(`feature-${featureName}-${action}`, additionalProps);
    }
  };

  /**
   * Track when demo users try to use restricted features
   */
  const trackDemoRestriction = (feature: string, attemptedAction: string) => {
    if (isDemo) {
      trackDemo('restriction-encountered', {
        feature,
        attemptedAction,
        username: user?.username,
      });
    }
  };

  /**
   * Track conversion events (demo to regular user)
   */
  const trackConversion = (conversionType: string, additionalProps?: Record<string, any>) => {
    trackDemo('conversion-attempt', {
      conversionType,
      ...additionalProps,
    });
  };

  return {
    // Core tracking functions
    trackButton,
    trackDemo,
    trackLink,
    trackForm,
    trackNavigation,
    trackFeature,
    trackDemoRestriction,
    trackConversion,

    // Direct access to base tracking functions
    trackQuery,
    trackDeal,
    trackAuth,
    trackInteraction,
    trackError,
    trackPerformance,
    trackSession,

    // Context information
    sessionType,
    isDemo,
    user,
  };
};

export default useAnalytics;
