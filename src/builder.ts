/**
 * Builder pattern for settings configuration
 * Fluent API for creating settings definitions and structures
 */

import { z } from 'zod';
import { 
  SettingDefinition, 
  SettingsStructure, 
  SettingsConfiguration,
  SettingValueType,
  SettingValue,
  RelevanceFunction,
  SettingsGroup,
  SettingsTab
} from './types';

// Strict object shape utility: disallow extra properties on object literals
type NoExtraProps<Expected, Actual extends Expected> = Actual & Record<Exclude<keyof Actual, keyof Expected>, never>;

/**
 * Builder for individual settings
 */
export class SettingBuilder {
  private definition: Partial<SettingDefinition>;
  private parent: SettingsBuilder;

  constructor(key: string, parent: SettingsBuilder) {
    this.definition = { key };
    this.parent = parent;
  }

  /**
   * Set the setting type
   */
  type(type: SettingValueType): this {
    this.definition.type = type;
    return this;
  }

  /**
   * Set the default value
   */
  defaultValue(value: SettingValue): this {
    this.definition.defaultValue = value;
    return this;
  }

  /**
   * Add Zod schema validation
   */
  schema(schema: z.ZodType): this {
    this.definition.schema = schema;
    return this;
  }

  /**
   * Add relevance condition
   */
  dependsOn(relevanceFn: RelevanceFunction): this {
    this.definition.isRelevant = relevanceFn;
    return this;
  }

  /**
   * Set version for migration support
   */
  version(version: string): this {
    this.definition.version = version;
    return this;
  }

  /**
   * Add UI configuration
   */
  ui(config: {
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
  }): this {
    this.definition.ui = config;
    return this;
  }

  // Convenience methods for common configurations

  /**
   * Configure as a boolean toggle
   */
  toggle(title: string, description: string, category?: string): this;
  toggle<Shape extends { title: string; description?: string; category?: string }>(cfg: NoExtraProps<{ title: string; description?: string; category?: string }, Shape>): this;
  toggle(a: string | { title: string; description?: string; category?: string }, b?: string, c: string = 'General'): this {
    const cfg = typeof a === 'string' ? { title: a, description: b ?? '', category: c } : { title: a.title, description: a.description ?? '', category: a.category ?? 'General' };
    this.type('boolean');
    this.ui({
      title: cfg.title,
      description: cfg.description,
      category: cfg.category,
      controlType: 'toggle'
    });
    return this;
  }

  /**
   * Configure as a slider with range
   */
  slider(title: string, description: string, min: number, max: number, step?: number, unit?: string, category?: string): this;
  slider<Shape extends { title: string; description?: string; min: number; max: number; step?: number; unit?: string; category?: string }>(cfg: NoExtraProps<{ title: string; description?: string; min: number; max: number; step?: number; unit?: string; category?: string }, Shape>): this;
  slider(
    a: string | { title: string; description?: string; min: number; max: number; step?: number; unit?: string; category?: string },
    b?: string,
    min?: number,
    max?: number,
    step: number = 1,
    unit?: string,
    category: string = 'General'
  ): this {
    const cfg = typeof a === 'string'
      ? { title: a, description: b ?? '', min: min!, max: max!, step, unit, category }
      : { title: a.title, description: a.description ?? '', min: a.min, max: a.max, step: a.step ?? 1, unit: a.unit, category: a.category ?? 'General' };
    this.type('number');
    this.ui({
      title: cfg.title,
      description: cfg.description,
      category: cfg.category!,
      controlType: 'slider',
      controlProps: { min: cfg.min, max: cfg.max, step: cfg.step, unit: cfg.unit }
    });
    return this;
  }

  /**
   * Configure as a select dropdown
   */
  select(title: string, description: string, options: { label: string; value: string }[], category?: string): this;
  select<Shape extends { title: string; description?: string; options: { label: string; value: string }[]; category?: string }>(cfg: NoExtraProps<{ title: string; description?: string; options: { label: string; value: string }[]; category?: string }, Shape>): this;
  select(
    a: string | { title: string; description?: string; options: { label: string; value: string }[]; category?: string },
    b?: string,
    options?: { label: string; value: string }[],
    category: string = 'General'
  ): this {
    const cfg = typeof a === 'string'
      ? { title: a, description: b ?? '', options: options!, category }
      : { title: a.title, description: a.description ?? '', options: a.options, category: a.category ?? 'General' };
    this.type('enum');
    this.ui({
      title: cfg.title,
      description: cfg.description,
      category: cfg.category!,
      controlType: 'select',
      controlProps: { options: cfg.options }
    });
    return this;
  }

  /**
   * Configure as a color picker
   */
  color(title: string, description: string, showHex?: boolean, category?: string): this;
  color<Shape extends { title: string; description?: string; showHex?: boolean; category?: string }>(cfg: NoExtraProps<{ title: string; description?: string; showHex?: boolean; category?: string }, Shape>): this;
  color(
    a: string | { title: string; description?: string; showHex?: boolean; category?: string },
    b?: string,
    showHex: boolean = true,
    category: string = 'General'
  ): this {
    const cfg = typeof a === 'string'
      ? { title: a, description: b ?? '', showHex, category }
      : { title: a.title, description: a.description ?? '', showHex: a.showHex ?? true, category: a.category ?? 'General' };
    this.type('string');
    this.ui({
      title: cfg.title,
      description: cfg.description,
      category: cfg.category!,
      controlType: 'color',
      controlProps: { showHex: cfg.showHex }
    });
    return this;
  }

  /**
   * Configure as a text input
   */
  input(title: string, description: string, category?: string): this;
  input<Shape extends { title: string; description?: string; category?: string }>(cfg: NoExtraProps<{ title: string; description?: string; category?: string }, Shape>): this;
  input(a: string | { title: string; description?: string; category?: string }, b?: string, c: string = 'General'): this {
    const cfg = typeof a === 'string' ? { title: a, description: b ?? '', category: c } : { title: a.title, description: a.description ?? '', category: a.category ?? 'General' };
    this.type('string');
    this.ui({
      title: cfg.title,
      description: cfg.description,
      category: cfg.category,
      controlType: 'input'
    });
    return this;
  }

  /**
   * Mark as developer-only setting
   */
  dev(): this {
    if (this.definition.ui) {
      this.definition.ui.isDev = true;
    } else {
      this.definition.ui = { isDev: true } as any;
    }
    return this;
  }

  /**
   * Mark as advanced setting
   */
  advanced(): this {
    if (this.definition.ui) {
      this.definition.ui.isAdvanced = true;
    } else {
      this.definition.ui = { isAdvanced: true } as any;
    }
    return this;
  }

  /**
   * Set display order
   */
  order(order: number): this {
    if (this.definition.ui) {
      this.definition.ui.order = order;
    } else {
      this.definition.ui = { order } as any;
    }
    return this;
  }

  // Builder chaining methods

  /**
   * Start defining another setting
   */
  setting(key: string): SettingBuilder {
    this.finish();
    return this.parent.setting(key);
  }

  /**
   * Start defining a tab
   */
  tab(id: string, label: string, icon: string = ''): TabBuilder {
    this.finish();
    return this.parent.tab(id, label, icon);
  }

  /**
   * Finish building and return to parent
   */
  build(): SettingsConfiguration {
    this.finish();
    return this.parent.build();
  }

  /**
   * Internal method to finalize the setting
   */
  private finish(): void {
    if (!this.definition.key || !this.definition.type || this.definition.defaultValue === undefined) {
      throw new Error(`Incomplete setting definition for ${this.definition.key}`);
    }
    
    this.parent.addDefinition(this.definition as SettingDefinition);
  }
}

/**
 * Builder for groups within tabs
 */
export class GroupBuilder {
  private groupData: Partial<SettingsGroup> = { settings: [] };
  private parent: TabBuilder;

  constructor(title: string, parent: TabBuilder) {
    this.groupData.title = title;
    this.parent = parent;
  }

  /**
   * Set group description
   */
  description(description: string): this {
    this.groupData.description = description;
    return this;
  }

  /**
   * Add settings to this group
   */
  settings(keys: string[]): TabBuilder {
    this.groupData.settings = keys.map(key => ({ key }));
    this.finish();
    return this.parent;
  }

  /**
   * Add a setting with overrides
   */
  setting(key: string, overrides?: any): this {
    this.groupData.settings!.push({ key, overrides });
    return this;
  }

  /**
   * Start defining another group
   */
  group(title: string, description?: string): GroupBuilder {
    this.finish();
    return this.parent.group(title, description);
  }

  /**
   * Start defining another tab
   */
  tab(id: string, label: string, icon: string = ''): TabBuilder {
    this.finish();
    return this.parent.tab(id, label, icon);
  }

  /**
   * Finish building
   */
  build(): SettingsConfiguration {
    this.finish();
    return this.parent.build();
  }

  /**
   * Internal method to finalize the group
   */
  private finish(): void {
    if (!this.groupData.title || !this.groupData.settings?.length) {
      throw new Error(`Incomplete group definition: ${this.groupData.title}`);
    }
    
    this.parent.addGroup(this.groupData as SettingsGroup);
  }
}

/**
 * Builder for tabs
 */
export class TabBuilder {
  private tabData: Partial<SettingsTab> = { groups: [] };
  private parent: SettingsBuilder;

  constructor(id: string, label: string, icon: string, parent: SettingsBuilder) {
    this.tabData.id = id;
    this.tabData.label = label;
    this.tabData.icon = icon;
    this.parent = parent;
  }

  /**
   * Mark tab as constant (always visible)
   */
  constant(): this {
    this.tabData.isConstant = true;
    return this;
  }

  /**
   * Start defining a group
   */
  group(title: string, description?: string): GroupBuilder {
    const builder = new GroupBuilder(title, this);
    if (description) {
      builder.description(description);
    }
    return builder;
  }

  /**
   * Add a group directly
   */
  addGroup(group: SettingsGroup): void {
    this.tabData.groups!.push(group);
  }

  /**
   * Start defining another tab
   */
  tab(id: string, label: string, icon: string = ''): TabBuilder {
    this.finish();
    return this.parent.tab(id, label, icon);
  }

  /**
   * Start defining a setting
   */
  setting(key: string): SettingBuilder {
    this.finish();
    return this.parent.setting(key);
  }

  /**
   * Finish building
   */
  build(): SettingsConfiguration {
    this.finish();
    return this.parent.build();
  }

  /**
   * Internal method to finalize the tab
   */
  private finish(): void {
    if (!this.tabData.id || !this.tabData.label) {
      throw new Error(`Incomplete tab definition: ${this.tabData.id}`);
    }
    
    this.parent.addTab(this.tabData as SettingsTab);
  }
}

/**
 * Main settings builder
 */
export class SettingsBuilder {
  private definitions: SettingDefinition[] = [];
  private structure: SettingsStructure = { tabs: [] };

  /**
   * Start defining a setting
   */
  setting(key: string): SettingBuilder {
    return new SettingBuilder(key, this);
  }

  /**
   * Start defining a tab
   */
  tab(id: string, label: string, icon: string = ''): TabBuilder {
    return new TabBuilder(id, label, icon, this);
  }

  /**
   * Add a completed definition
   */
  addDefinition(definition: SettingDefinition): void {
    this.definitions.push(definition);
  }

  /**
   * Add a completed tab
   */
  addTab(tab: SettingsTab): void {
    this.structure.tabs.push(tab);
  }

  /**
   * Build the final configuration
   */
  build(): SettingsConfiguration {
    return {
      definitions: [...this.definitions],
      structure: { tabs: [...this.structure.tabs] }
    };
  }

  /**
   * Build with validation
   */
  buildWithValidation(): SettingsConfiguration {
    const config = this.build();
    
    // Validate that all referenced settings exist
    const definedKeys = new Set(config.definitions.map(d => d.key));
    const referencedKeys = new Set<string>();
    
    for (const tab of config.structure.tabs) {
      for (const group of tab.groups) {
        for (const setting of group.settings) {
          referencedKeys.add(setting.key);
        }
      }
    }
    
    const missingDefinitions = Array.from(referencedKeys).filter(key => !definedKeys.has(key));
    const unusedDefinitions = Array.from(definedKeys).filter(key => !referencedKeys.has(key));
    
    if (missingDefinitions.length > 0) {
      console.warn('[PITZ] Missing setting definitions:', missingDefinitions);
    }
    
    if (unusedDefinitions.length > 0) {
      console.warn('[PITZ] Unused setting definitions:', unusedDefinitions);
    }
    
    return config;
  }

  /**
   * Create from existing configuration (for modification)
   */
  static fromConfiguration(config: SettingsConfiguration): SettingsBuilder {
    const builder = new SettingsBuilder();
    builder.definitions = [...config.definitions];
    builder.structure = { tabs: [...config.structure.tabs] };
    return builder;
  }

  /**
   * Merge multiple configurations
   */
  static merge(...configs: SettingsConfiguration[]): SettingsConfiguration {
    const allDefinitions: SettingDefinition[] = [];
    const allTabs: SettingsTab[] = [];
    
    for (const config of configs) {
      allDefinitions.push(...config.definitions);
      allTabs.push(...config.structure.tabs);
    }
    
    // Remove duplicates by key
    const uniqueDefinitions = allDefinitions.reduce((acc, def) => {
      acc[def.key] = def;
      return acc;
    }, {} as Record<string, SettingDefinition>);
    
    // Remove duplicate tabs by id
    const uniqueTabs = allTabs.reduce((acc, tab) => {
      acc[tab.id] = tab;
      return acc;
    }, {} as Record<string, SettingsTab>);
    
    return {
      definitions: Object.values(uniqueDefinitions),
      structure: { tabs: Object.values(uniqueTabs) }
    };
  }
}