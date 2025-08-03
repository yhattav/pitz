import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createSettingsStore } from '../src/store';
import { MemoryStorageAdapter } from '../src/storage';
import { SettingsBuilder } from '../src/builder';
import { RelevanceTemplates } from '../src/templates';

describe('Pitz Settings Library', () => {
  describe('Basic Store Functionality', () => {
    let store: ReturnType<typeof createSettingsStore>;

    beforeEach(() => {
      store = createSettingsStore({
        storage: new MemoryStorageAdapter(),
        debug: false,
        throttleMs: 1 // Very short throttle for testing
      });
    });

    it('should create a store with initial state', () => {
      const state = store.getState();
      expect(state.values).toEqual({});
      expect(state.controllers).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should register and manage controllers', () => {
      const controller = {
        key: 'test.setting',
        type: 'boolean' as const,
        defaultValue: true,
        title: 'Test Setting',
        description: 'A test setting'
      };

      store.getState().registerController(controller);
      
      const state = store.getState();
      expect(state.controllers['test.setting']).toEqual(controller);
    });

    it('should set and get values', async () => {
      const controller = {
        key: 'test.number',
        type: 'number' as const,
        defaultValue: 42,
        title: 'Test Number',
        description: 'A test number'
      };

      store.getState().registerController(controller);
      await store.getState().setValue('test.number', 100);

      const state = store.getState();
      expect(state.values['test.number']).toBe(100);
    });

    it('should reset to default values', async () => {
      const controller = {
        key: 'test.reset',
        type: 'string' as const,
        defaultValue: 'default',
        title: 'Test Reset',
        description: 'A test reset'
      };

      store.getState().registerController(controller);
      await store.getState().setValue('test.reset', 'changed');
      await store.getState().resetToDefault('test.reset');

      // Wait a tiny bit for throttled update to complete
      await new Promise(resolve => setTimeout(resolve, 5));

      const state = store.getState();
      expect(state.values['test.reset']).toBe('default');
    });

    it('should validate values with schema', async () => {
      const controller = {
        key: 'test.validated',
        type: 'number' as const,
        defaultValue: 5,
        schema: z.number().min(0).max(10),
        title: 'Test Validated',
        description: 'A validated setting'
      };

      store.getState().registerController(controller);

      // Valid value should work
      await expect(store.getState().setValue('test.validated', 7)).resolves.not.toThrow();

      // Invalid value should throw
      await expect(store.getState().setValue('test.validated', 15)).rejects.toThrow();
    });
  });

  describe('Builder Pattern', () => {
    it('should create settings using builder pattern', () => {
      const config = new SettingsBuilder()
        .setting('graphics.quality')
          .type('enum')
          .defaultValue('high')
          .ui({
            title: 'Graphics Quality',
            description: 'Set the graphics quality level',
            category: 'Graphics',
            controlType: 'select',
            controlProps: {
              options: [
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' }
              ]
            }
          })
        .setting('graphics.vsync')
          .toggle('V-Sync', 'Enable vertical synchronization', 'Graphics')
          .defaultValue(true)
        .tab('graphics', 'Graphics', 'FaPalette')
          .group('Quality')
            .settings(['graphics.quality', 'graphics.vsync'])
        .build();

      expect(config.definitions).toHaveLength(2);
      expect(config.structure.tabs).toHaveLength(1);
      expect(config.definitions[0].key).toBe('graphics.quality');
      expect(config.definitions[1].key).toBe('graphics.vsync');
    });

    it('should support fluent API for common control types', () => {
      const config = new SettingsBuilder()
        .setting('volume')
          .slider('Volume', 'Audio volume level', 0, 100, 1, '%', 'Audio')
          .defaultValue(50)
        .setting('muted')
          .toggle('Mute', 'Mute all audio', 'Audio')
          .defaultValue(false)
        .setting('theme')
          .select('Theme', 'Color theme', [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' }
          ], 'Appearance')
          .defaultValue('light')
        .build();

      expect(config.definitions).toHaveLength(3);
      
      const volumeSetting = config.definitions.find(d => d.key === 'volume');
      expect(volumeSetting?.ui?.controlType).toBe('slider');
      expect(volumeSetting?.ui?.controlProps?.min).toBe(0);
      expect(volumeSetting?.ui?.controlProps?.max).toBe(100);
    });
  });

  describe('Relevance Templates', () => {
    it('should provide common relevance patterns', () => {
      const settings = {
        'feature.enabled': true,
        'quality.level': 'high',
        'volume': 75
      };

      // Test dependsOn
      const dependsOnEnabled = RelevanceTemplates.dependsOn('feature.enabled');
      expect(dependsOnEnabled(settings)).toBe(true);

      // Test equals
      const equalsHigh = RelevanceTemplates.equals('quality.level', 'high');
      expect(equalsHigh(settings)).toBe(true);

      // Test greaterThan
      const greaterThan50 = RelevanceTemplates.greaterThan('volume', 50);
      expect(greaterThan50(settings)).toBe(true);

      // Test allOf
      const allConditions = RelevanceTemplates.allOf(
        dependsOnEnabled,
        equalsHigh
      );
      expect(allConditions(settings)).toBe(true);
    });

    it('should handle domain-specific patterns', () => {
      const settings = {
        'graphics.postProcessing.enabled': true,
        'graphics.postProcessing.bloom.enabled': true,
        'projectile.type': 'guided'
      };

      expect(RelevanceTemplates.postProcessingEnabled()(settings)).toBe(true);
      expect(RelevanceTemplates.bloomEnabled()(settings)).toBe(true);
      expect(RelevanceTemplates.isGuided()(settings)).toBe(true);
    });
  });

  describe('Settings with Relevance', () => {
    it('should respect relevance conditions', () => {
      const config = new SettingsBuilder()
        .setting('postprocessing.enabled')
          .toggle('Post-Processing', 'Enable post-processing effects', 'Graphics')
          .defaultValue(true)
        .setting('postprocessing.bloom.enabled')
          .toggle('Bloom', 'Enable bloom effect', 'Graphics')
          .defaultValue(true)
          .dependsOn(RelevanceTemplates.dependsOn('postprocessing.enabled'))
        .setting('postprocessing.bloom.intensity')
          .slider('Bloom Intensity', 'Intensity of bloom effect', 0, 5, 0.1, '', 'Graphics')
          .defaultValue(1.5)
          .dependsOn(RelevanceTemplates.allOf(
            RelevanceTemplates.dependsOn('postprocessing.enabled'),
            RelevanceTemplates.dependsOn('postprocessing.bloom.enabled')
          ))
        .build();

      // Test with post-processing disabled
      let settings = { 'postprocessing.enabled': false };
      let bloomEnabledDef = config.definitions.find(d => d.key === 'postprocessing.bloom.enabled');
      let bloomIntensityDef = config.definitions.find(d => d.key === 'postprocessing.bloom.intensity');

      expect(bloomEnabledDef?.isRelevant?.(settings)).toBe(false);
      expect(bloomIntensityDef?.isRelevant?.(settings)).toBe(false);

      // Test with post-processing enabled but bloom disabled
      settings = { 
        'postprocessing.enabled': true, 
        'postprocessing.bloom.enabled': false 
      };
      expect(bloomEnabledDef?.isRelevant?.(settings)).toBe(true);
      expect(bloomIntensityDef?.isRelevant?.(settings)).toBe(false);

      // Test with both enabled
      settings = { 
        'postprocessing.enabled': true, 
        'postprocessing.bloom.enabled': true 
      };
      expect(bloomEnabledDef?.isRelevant?.(settings)).toBe(true);
      expect(bloomIntensityDef?.isRelevant?.(settings)).toBe(true);
    });
  });

  describe('Integration Test', () => {
    it('should work end-to-end with store, builder, and relevance', async () => {
      // Create configuration
      const config = new SettingsBuilder()
        .setting('audio.enabled')
          .toggle('Audio Enabled', 'Enable all audio', 'Audio')
          .defaultValue(true)
        .setting('audio.volume')
          .slider('Volume', 'Master volume', 0, 100, 1, '%', 'Audio')
          .defaultValue(50)
          .dependsOn(RelevanceTemplates.dependsOn('audio.enabled'))
        .setting('audio.music.volume')
          .slider('Music Volume', 'Music volume', 0, 100, 1, '%', 'Audio')
          .defaultValue(75)
          .dependsOn(RelevanceTemplates.dependsOn('audio.enabled'))
        .tab('audio', 'Audio', 'FaVolumeUp')
          .group('General')
            .settings(['audio.enabled', 'audio.volume'])
          .group('Music')
            .settings(['audio.music.volume'])
        .build();

      // Create store with memory storage
      const store = createSettingsStore({
        storage: new MemoryStorageAdapter(),
        debug: false,
        throttleMs: 1 // Very short throttle for testing
      });

      // Register all controllers
      for (const definition of config.definitions) {
        store.getState().registerController({
          ...definition,
          title: definition.ui?.title || definition.key,
          description: definition.ui?.description || '',
          category: definition.ui?.category
        });
      }

      // Set initial values
      const initialValues = config.definitions.reduce((acc, def) => {
        acc[def.key] = def.defaultValue;
        return acc;
      }, {} as Record<string, any>);
      
      await store.getState().setValues(initialValues);

      // Test relevance
      let state = store.getState();
      expect(state.values['audio.enabled']).toBe(true);
      expect(state.values['audio.volume']).toBe(50);

      // Disable audio and check relevance
      await store.getState().setValue('audio.enabled', false);
      
      // Wait for throttled update
      await new Promise(resolve => setTimeout(resolve, 5));
      
      state = store.getState();

      const volumeDef = config.definitions.find(d => d.key === 'audio.volume');
      const musicVolumeDef = config.definitions.find(d => d.key === 'audio.music.volume');



      expect(volumeDef?.isRelevant?.(state.values)).toBe(false);
      expect(musicVolumeDef?.isRelevant?.(state.values)).toBe(false);

      // Re-enable audio
      await store.getState().setValue('audio.enabled', true);
      state = store.getState();

      expect(volumeDef?.isRelevant?.(state.values)).toBe(true);
      expect(musicVolumeDef?.isRelevant?.(state.values)).toBe(true);
    });
  });
});