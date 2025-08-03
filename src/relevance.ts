/**
 * Relevance engine for conditional settings display
 * Pure functions for evaluating setting visibility and dependencies
 */

import { 
  SettingValue, 
  RelevanceFunction, 
  SettingsStructure, 
  SettingDefinition,
  SettingStructureItem 
} from './types';

/**
 * Pure function-based relevance engine
 * Framework-agnostic conditional logic evaluation
 */
export class RelevanceEngine {
  /**
   * Evaluate whether a setting should be visible/relevant
   */
  static evaluate(
    settingKey: string,
    structure: SettingsStructure,
    definitions: SettingDefinition[],
    currentValues: Record<string, SettingValue>
  ): boolean {
    // Check definition-level relevance
    const definition = definitions.find(d => d.key === settingKey);
    if (definition?.isRelevant && !definition.isRelevant(currentValues)) {
      return false;
    }

    // Check structure-level relevance
    const structureItem = this.findInStructure(settingKey, structure);
    if (structureItem?.isRelevant && !structureItem.isRelevant(currentValues)) {
      return false;
    }

    return true;
  }

  /**
   * Get all visible settings based on current values
   */
  static getVisibleSettings(
    structure: SettingsStructure,
    definitions: SettingDefinition[],
    currentValues: Record<string, SettingValue>
  ): string[] {
    const allKeys = this.extractAllKeys(structure);
    return allKeys.filter(key =>
      this.evaluate(key, structure, definitions, currentValues)
    );
  }

  /**
   * Get settings that depend on a specific setting
   */
  static getDependentSettings(
    changedKey: string,
    structure: SettingsStructure,
    definitions: SettingDefinition[]
  ): string[] {
    const allKeys = this.extractAllKeys(structure);
    const dependents: string[] = [];

    for (const key of allKeys) {
      // Check if this setting's relevance function references the changed key
      const definition = definitions.find(d => d.key === key);
      const structureItem = this.findInStructure(key, structure);

      if (this.referencesSetting(definition?.isRelevant, changedKey) ||
          this.referencesSetting(structureItem?.isRelevant, changedKey)) {
        dependents.push(key);
      }
    }

    return dependents;
  }

  /**
   * Find a setting in the structure
   */
  private static findInStructure(
    settingKey: string,
    structure: SettingsStructure
  ): SettingStructureItem | undefined {
    for (const tab of structure.tabs) {
      for (const group of tab.groups) {
        const item = group.settings.find(s => s.key === settingKey);
        if (item) return item;
      }
    }
    return undefined;
  }

  /**
   * Extract all setting keys from structure
   */
  private static extractAllKeys(structure: SettingsStructure): string[] {
    const keys: string[] = [];
    for (const tab of structure.tabs) {
      for (const group of tab.groups) {
        for (const setting of group.settings) {
          keys.push(setting.key);
        }
      }
    }
    return keys;
  }

  /**
   * Check if a relevance function references a specific setting
   * This is a heuristic - in practice, you might want more sophisticated analysis
   */
  private static referencesSetting(
    relevanceFn: RelevanceFunction | undefined,
    settingKey: string
  ): boolean {
    if (!relevanceFn) return false;
    
    // Convert function to string and check if it references the setting key
    const fnString = relevanceFn.toString();
    
    // Look for common patterns:
    // settings["key"], settings['key'], settings.key, settings[key]
    const patterns = [
      `["${settingKey}"]`,
      `['${settingKey}']`,
      `[${settingKey}]`,
      `.${settingKey}`,
      `"${settingKey}"`,
      `'${settingKey}'`
    ];
    
    return patterns.some(pattern => fnString.includes(pattern));
  }

  /**
   * Batch evaluate multiple settings
   */
  static batchEvaluate(
    settingKeys: string[],
    structure: SettingsStructure,
    definitions: SettingDefinition[],
    currentValues: Record<string, SettingValue>
  ): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    for (const key of settingKeys) {
      results[key] = this.evaluate(key, structure, definitions, currentValues);
    }
    
    return results;
  }

  /**
   * Get relevance tree - which settings affect which other settings
   */
  static getRelevanceTree(
    structure: SettingsStructure,
    definitions: SettingDefinition[]
  ): Record<string, string[]> {
    const tree: Record<string, string[]> = {};
    const allKeys = this.extractAllKeys(structure);

    for (const key of allKeys) {
      tree[key] = this.getDependentSettings(key, structure, definitions);
    }

    return tree;
  }

  /**
   * Validate relevance functions by checking for circular dependencies
   */
  static validateRelevanceTree(
    structure: SettingsStructure,
    definitions: SettingDefinition[]
  ): { valid: boolean; errors: string[] } {
    const tree = this.getRelevanceTree(structure, definitions);
    const errors: string[] = [];

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        errors.push(`Circular dependency detected involving setting: ${node}`);
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      for (const dependent of tree[node] || []) {
        if (hasCycle(dependent)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const key of Object.keys(tree)) {
      if (!visited.has(key)) {
        hasCycle(key);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get settings ordered by dependency (dependencies first)
   */
  static getDependencyOrder(
    structure: SettingsStructure,
    definitions: SettingDefinition[]
  ): string[] {
    const tree = this.getRelevanceTree(structure, definitions);
    const allKeys = this.extractAllKeys(structure);
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (key: string): void => {
      if (visited.has(key)) return;
      visited.add(key);

      // Visit dependencies first
      for (const dependent of tree[key] || []) {
        visit(dependent);
      }

      result.push(key);
    };

    for (const key of allKeys) {
      visit(key);
    }

    return result.reverse(); // Reverse to get dependencies first
  }
}