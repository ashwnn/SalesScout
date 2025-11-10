/**
 * Umami Analytics Utility
 * 
 * This utility provides a comprehensive interface for tracking events with Umami analytics.
 * It includes type-safe event tracking, custom properties, and automatic page view tracking.
 */

// Extend the Window interface to include Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
      identify: (properties: Record<string, any>) => void;
    };
  }
}

// Event categories for better organization
export enum UmamiEventCategory {
  AUTH = 'auth',
  QUERY = 'query',
  DEAL = 'deal',
  NAVIGATION = 'navigation',
  USER_INTERACTION = 'user-interaction',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

// Common event names
export enum UmamiEvent {
  // Authentication events
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  LOGIN_FAILED = 'login-failed',
  REGISTER_FAILED = 'register-failed',
  
  // Query events
  QUERY_CREATED = 'query-created',
  QUERY_UPDATED = 'query-updated',
  QUERY_DELETED = 'query-deleted',
  QUERY_VIEWED = 'query-viewed',
  QUERY_EXECUTED = 'query-executed',
  
  // Deal events
  DEAL_VIEWED = 'deal-viewed',
  DEAL_FILTERED = 'deal-filtered',
  DEAL_SORTED = 'deal-sorted',
  DEAL_SEARCHED = 'deal-searched',
  DEAL_CLICKED = 'deal-clicked',
  DEAL_EXTERNAL_LINK = 'deal-external-link',
  
  // Navigation events
  PAGE_VIEW = 'page-view',
  ROUTE_CHANGE = 'route-change',
  
  // User interaction events
  BUTTON_CLICK = 'button-click',
  FORM_SUBMIT = 'form-submit',
  SEARCH = 'search',
  FILTER_APPLIED = 'filter-applied',
  SORT_APPLIED = 'sort-applied',
  THEME_CHANGED = 'theme-changed',
  
  // Error events
  API_ERROR = 'api-error',
  VALIDATION_ERROR = 'validation-error',
  NETWORK_ERROR = 'network-error',
  
  // Performance events
  SLOW_API_CALL = 'slow-api-call',
  PAGE_LOAD = 'page-load',
}

interface UmamiConfig {
  enabled: boolean;
  src: string;
  websiteId: string;
  domains?: string;
  autoTrack: boolean;
  debug: boolean;
}

class UmamiAnalytics {
  private config: UmamiConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      enabled: process.env.REACT_APP_UMAMI_ENABLED === 'true',
      src: process.env.REACT_APP_UMAMI_SRC || '',
      websiteId: process.env.REACT_APP_UMAMI_WEBSITE_ID || '',
      domains: process.env.REACT_APP_UMAMI_DOMAINS,
      autoTrack: process.env.REACT_APP_UMAMI_AUTO_TRACK !== 'false',
      debug: process.env.REACT_APP_UMAMI_DEBUG === 'true',
    };
  }

  /**
   * Initialize Umami analytics script
   */
  init(): void {
    if (!this.config.enabled || this.initialized) {
      if (this.config.debug) {
        console.log('[Umami] Analytics disabled or already initialized');
      }
      return;
    }

    if (!this.config.src || !this.config.websiteId) {
      console.warn('[Umami] Missing required configuration (src or websiteId)');
      return;
    }

    try {
      const script = document.createElement('script');
      script.defer = true;
      script.src = this.config.src;
      script.setAttribute('data-website-id', this.config.websiteId);
      
      if (this.config.domains) {
        script.setAttribute('data-domains', this.config.domains);
      }
      
      if (!this.config.autoTrack) {
        script.setAttribute('data-auto-track', 'false');
      }

      document.head.appendChild(script);
      this.initialized = true;

      if (this.config.debug) {
        console.log('[Umami] Analytics initialized successfully', {
          websiteId: this.config.websiteId,
          domains: this.config.domains,
          autoTrack: this.config.autoTrack,
        });
      }
    } catch (error) {
      console.error('[Umami] Failed to initialize analytics:', error);
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, eventData?: Record<string, any>): void {
    if (!this.config.enabled) {
      if (this.config.debug) {
        console.log('[Umami] Tracking disabled, event not sent:', eventName, eventData);
      }
      return;
    }

    try {
      if (window.umami) {
        window.umami.track(eventName, eventData);
        
        if (this.config.debug) {
          console.log('[Umami] Event tracked:', eventName, eventData);
        }
      } else if (this.config.debug) {
        console.warn('[Umami] Umami not loaded yet, event queued:', eventName, eventData);
      }
    } catch (error) {
      console.error('[Umami] Error tracking event:', error);
    }
  }

  /**
   * Track a categorized event with additional context
   */
  trackEvent(
    category: UmamiEventCategory,
    event: UmamiEvent | string,
    properties?: Record<string, any>
  ): void {
    const eventName = `${category}:${event}`;
    this.track(eventName, properties);
  }

  /**
   * Identify user with custom properties
   */
  identify(properties: Record<string, any>): void {
    if (!this.config.enabled) return;

    try {
      if (window.umami) {
        window.umami.identify(properties);
        
        if (this.config.debug) {
          console.log('[Umami] User identified:', properties);
        }
      }
    } catch (error) {
      console.error('[Umami] Error identifying user:', error);
    }
  }

  /**
   * Track page views (for SPAs)
   */
  trackPageView(path?: string, properties?: Record<string, any>): void {
    const pagePath = path || window.location.pathname;
    this.track(UmamiEvent.PAGE_VIEW, {
      path: pagePath,
      ...properties,
    });
  }

  /**
   * Track authentication events
   */
  trackAuth(action: 'login' | 'logout' | 'register', success: boolean, properties?: Record<string, any>): void {
    const event = success 
      ? action 
      : `${action}-failed`;
    
    this.trackEvent(UmamiEventCategory.AUTH, event as UmamiEvent, {
      success,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Track query-related events
   */
  trackQuery(
    action: 'created' | 'updated' | 'deleted' | 'viewed' | 'executed',
    queryId?: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent(UmamiEventCategory.QUERY, `query-${action}` as UmamiEvent, {
      queryId,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Track deal-related events
   */
  trackDeal(
    action: 'viewed' | 'filtered' | 'sorted' | 'searched' | 'clicked' | 'external-link',
    properties?: Record<string, any>
  ): void {
    this.trackEvent(UmamiEventCategory.DEAL, `deal-${action}` as UmamiEvent, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Track errors
   */
  trackError(
    errorType: 'api' | 'validation' | 'network',
    error: Error | string,
    properties?: Record<string, any>
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    this.trackEvent(UmamiEventCategory.ERROR, `${errorType}-error` as UmamiEvent, {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    this.trackEvent(UmamiEventCategory.PERFORMANCE, metric, {
      value,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(
    action: 'button-click' | 'form-submit' | 'search' | 'filter-applied' | 'sort-applied' | 'theme-changed',
    properties?: Record<string, any>
  ): void {
    this.trackEvent(UmamiEventCategory.USER_INTERACTION, action as UmamiEvent, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): UmamiConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const umami = new UmamiAnalytics();

// Export utility functions for easier usage
export const trackEvent = umami.trackEvent.bind(umami);
export const trackPageView = umami.trackPageView.bind(umami);
export const trackAuth = umami.trackAuth.bind(umami);
export const trackQuery = umami.trackQuery.bind(umami);
export const trackDeal = umami.trackDeal.bind(umami);
export const trackError = umami.trackError.bind(umami);
export const trackPerformance = umami.trackPerformance.bind(umami);
export const trackInteraction = umami.trackInteraction.bind(umami);

export default umami;
