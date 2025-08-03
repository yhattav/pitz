/**
 * Relevance templates for common conditional patterns
 * Reusable relevance functions for typical use cases
 */

import { RelevanceFunction, SettingValue } from './types';

/**
 * Collection of common relevance patterns
 */
export const RelevanceTemplates = {
  /**
   * Setting is relevant when another setting is truthy
   */
  dependsOn: (parentKey: string): RelevanceFunction => 
    (settings) => !!settings[parentKey],

  /**
   * Setting is relevant when another setting equals a specific value
   */
  equals: (key: string, value: SettingValue): RelevanceFunction =>
    (settings) => settings[key] === value,

  /**
   * Setting is relevant when another setting does NOT equal a specific value
   */
  notEquals: (key: string, value: SettingValue): RelevanceFunction =>
    (settings) => settings[key] !== value,

  /**
   * Setting is relevant when another setting is greater than a value
   */
  greaterThan: (key: string, value: number): RelevanceFunction =>
    (settings) => typeof settings[key] === 'number' && settings[key] > value,

  /**
   * Setting is relevant when another setting is less than a value
   */
  lessThan: (key: string, value: number): RelevanceFunction =>
    (settings) => typeof settings[key] === 'number' && settings[key] < value,

  /**
   * Setting is relevant when another setting is within a range
   */
  inRange: (key: string, min: number, max: number): RelevanceFunction =>
    (settings) => {
      const value = settings[key];
      return typeof value === 'number' && value >= min && value <= max;
    },

  /**
   * Setting is relevant when another setting matches any of the given values
   */
  oneOf: (key: string, values: SettingValue[]): RelevanceFunction =>
    (settings) => values.includes(settings[key]),

  /**
   * Setting is relevant when another setting matches none of the given values
   */
  noneOf: (key: string, values: SettingValue[]): RelevanceFunction =>
    (settings) => !values.includes(settings[key]),

  /**
   * Combine multiple conditions with AND logic
   */
  allOf: (...conditions: RelevanceFunction[]): RelevanceFunction =>
    (settings) => conditions.every(condition => condition(settings)),

  /**
   * Combine multiple conditions with OR logic
   */
  anyOf: (...conditions: RelevanceFunction[]): RelevanceFunction =>
    (settings) => conditions.some(condition => condition(settings)),

  /**
   * Negate a condition
   */
  not: (condition: RelevanceFunction): RelevanceFunction =>
    (settings) => !condition(settings),

  /**
   * Always relevant (default behavior)
   */
  always: (): RelevanceFunction =>
    () => true,

  /**
   * Never relevant (for disabling settings)
   */
  never: (): RelevanceFunction =>
    () => false,

  // Common domain-specific patterns from the original codebase

  /**
   * Graphics post-processing enabled
   */
  postProcessingEnabled: (): RelevanceFunction =>
    (settings) => !!settings['graphics.postProcessing.enabled'],

  /**
   * Bloom effect enabled (requires post-processing)
   */
  bloomEnabled: (): RelevanceFunction =>
    (settings) => 
      !!settings['graphics.postProcessing.enabled'] &&
      !!settings['graphics.postProcessing.bloom.enabled'],

  /**
   * Projectile is guided type
   */
  isGuided: (): RelevanceFunction =>
    (settings) => settings['projectile.type'] === 'guided',

  /**
   * Projectile is passive type
   */
  isPassive: (): RelevanceFunction =>
    (settings) => settings['projectile.type'] === 'passive',

  /**
   * Advanced mode is enabled
   */
  advancedMode: (): RelevanceFunction =>
    (settings) => !!settings['ui.advanced.enabled'],

  /**
   * Debug mode is enabled
   */
  debugMode: (): RelevanceFunction =>
    (settings) => !!settings['debug.enabled'],

  /**
   * Performance mode affects visibility
   */
  performanceMode: (mode: string): RelevanceFunction =>
    (settings) => settings['graphics.performance.mode'] === mode,

  /**
   * Platform-specific relevance
   */
  platform: (platformKey: string): RelevanceFunction =>
    (settings) => settings['system.platform'] === platformKey,

  /**
   * Feature flag enabled
   */
  featureEnabled: (featureKey: string): RelevanceFunction =>
    (settings) => !!settings[`features.${featureKey}.enabled`],

  /**
   * User role matches
   */
  hasRole: (role: string): RelevanceFunction =>
    (settings) => settings['user.role'] === role,

  /**
   * License level allows feature
   */
  licenseLevel: (minLevel: string): RelevanceFunction =>
    (settings) => {
      const levels = ['free', 'basic', 'pro', 'enterprise'];
      const currentLevel = settings['license.level'] as string;
      const requiredIndex = levels.indexOf(minLevel);
      const currentIndex = levels.indexOf(currentLevel);
      return currentIndex >= requiredIndex;
    },

  /**
   * Experimental features enabled
   */
  experimentalEnabled: (): RelevanceFunction =>
    (settings) => !!settings['experimental.enabled'],

  /**
   * Beta features enabled
   */
  betaEnabled: (): RelevanceFunction =>
    (settings) => !!settings['beta.enabled'],

  /**
   * Mobile device detected
   */
  isMobile: (): RelevanceFunction =>
    (settings) => !!settings['device.isMobile'],

  /**
   * Touch interface available
   */
  hasTouchInterface: (): RelevanceFunction =>
    (settings) => !!settings['device.hasTouch'],

  /**
   * Minimum screen width
   */
  minScreenWidth: (width: number): RelevanceFunction =>
    (settings) => {
      const screenWidth = settings['device.screenWidth'] as number;
      return typeof screenWidth === 'number' && screenWidth >= width;
    },

  /**
   * Theme-specific relevance
   */
  theme: (themeName: string): RelevanceFunction =>
    (settings) => settings['ui.theme'] === themeName,

  /**
   * Language-specific relevance
   */
  language: (languageCode: string): RelevanceFunction =>
    (settings) => settings['ui.language'] === languageCode,

  /**
   * Accessibility mode enabled
   */
  accessibilityMode: (): RelevanceFunction =>
    (settings) => !!settings['accessibility.enabled'],

  /**
   * High contrast mode
   */
  highContrast: (): RelevanceFunction =>
    (settings) => !!settings['accessibility.highContrast'],

  /**
   * Reduced motion preference
   */
  reducedMotion: (): RelevanceFunction =>
    (settings) => !!settings['accessibility.reducedMotion'],
};

/**
 * Utility functions for creating custom relevance patterns
 */
export const RelevanceUtils = {
  /**
   * Create a custom relevance function with validation
   */
  custom: (fn: RelevanceFunction): RelevanceFunction => {
    return (settings) => {
      try {
        return fn(settings);
      } catch (error) {
        console.error('[PITZ] Relevance function error:', error);
        return true; // Default to visible on error
      }
    };
  },

  /**
   * Create a cached relevance function (memoized)
   */
  cached: (fn: RelevanceFunction): RelevanceFunction => {
    const cache = new Map<string, boolean>();
    
    return (settings) => {
      const key = JSON.stringify(settings);
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = fn(settings);
      cache.set(key, result);
      return result;
    };
  },

  /**
   * Create a debounced relevance function
   */
  debounced: (fn: RelevanceFunction, delay: number = 100): RelevanceFunction => {
    let timeout: NodeJS.Timeout | null = null;
    let lastResult = true;
    
    return (settings) => {
      if (timeout) {
        return lastResult;
      }
      
      timeout = setTimeout(() => {
        timeout = null;
      }, delay);
      
      lastResult = fn(settings);
      return lastResult;
    };
  },

  /**
   * Compose multiple relevance functions
   */
  compose: (...functions: RelevanceFunction[]): RelevanceFunction => {
    return (settings) => {
      return functions.reduce((result, fn) => {
        return result && fn(settings);
      }, true);
    };
  },

  /**
   * Create a relevance function that logs its evaluation
   */
  logged: (fn: RelevanceFunction, label?: string): RelevanceFunction => {
    return (settings) => {
      const result = fn(settings);
      console.log(`[PITZ] Relevance ${label || 'function'}:`, result, settings);
      return result;
    };
  },
};