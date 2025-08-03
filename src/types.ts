/**
 * Core types for the Pitz settings library
 * Framework-agnostic type definitions
 */

import { z } from 'zod';

/**
 * Supported setting value types
 */
export type SettingValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'object'
  | 'array';

/**
 * Valid setting values
 */
export type SettingValue = string | number | boolean;

/**
 * Core setting definition - focused on data and validation
 */
export interface CoreSettingDefinition<T extends SettingValue = SettingValue> {
  key: string;
  type: SettingValueType;
  defaultValue: T;
  schema?: z.ZodType<T>;
  isRelevant?: (settings: Record<string, SettingValue>) => boolean;
  version?: string;
}

/**
 * UI-specific configuration for a setting
 */
export interface SettingUIConfig {
  key: string;
  title: string;
  description: string;
  category: string;
  tab?: string;
  order?: number;
  isDev?: boolean;
  isAdvanced?: boolean;
  controlType?: 'slider' | 'toggle' | 'select' | 'input' | 'color';
  controlProps?: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: { label: string; value: string }[];
    showAlpha?: boolean;
    showHex?: boolean;
    showRGB?: boolean;
    showHSL?: boolean;
  };
}

/**
 * Combined setting controller (for backward compatibility and convenience)
 */
export interface SettingController extends CoreSettingDefinition {
  title: string;
  description: string;
  category?: string;
  isDev?: boolean;
  isAdvanced?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
}

/**
 * Storage interface for settings persistence
 */
export interface SettingsStorage {
  get: <T extends SettingValue>(key: string) => Promise<T | null>;
  set: <T extends SettingValue>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Settings change subscription callback
 */
export type SettingsChangeCallback = (
  changes: { key: string; oldValue: SettingValue; newValue: SettingValue }[]
) => void;

/**
 * Settings context configuration
 */
export interface SettingsConfig {
  storage?: SettingsStorage;
  encryptionKey?: string;
  defaultValues?: Record<string, SettingValue>;
  debug?: boolean;
  throttleMs?: number;
}

/**
 * UI configuration map - all possible UI configurations
 */
export interface SettingsUIMap {
  [key: string]: Omit<SettingUIConfig, 'key'>;
}

/**
 * UI structure definition
 */
export interface SettingStructureItem {
  key: string;
  order?: number;
  overrides?: Partial<Omit<SettingUIConfig, 'key'>>;
  isRelevant?: (settings: Record<string, SettingValue>) => boolean;
}

export interface SettingsGroup {
  title: string;
  description?: string;
  settings: SettingStructureItem[];
}

export interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  groups: SettingsGroup[];
  isConstant?: boolean;
}

export interface SettingsStructure {
  tabs: SettingsTab[];
}

/**
 * Relevance function type - pure function for conditional logic
 */
export type RelevanceFunction = (settings: Record<string, SettingValue>) => boolean;

/**
 * Settings definition for builder pattern
 */
export interface SettingDefinition extends CoreSettingDefinition {
  ui?: Partial<SettingUIConfig>;
}

/**
 * Complete settings configuration
 */
export interface SettingsConfiguration {
  definitions: SettingDefinition[];
  structure: SettingsStructure;
}