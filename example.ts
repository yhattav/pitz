/**
 * Example usage of the Pitz Settings Library
 * Demonstrates framework-agnostic settings management
 */

import { z } from 'zod';
import { 
  SettingsBuilder, 
  createSettingsStore, 
  MemoryStorageAdapter,
  RelevanceTemplates 
} from './src/index';

console.log('🚀 Pitz Settings Library Example');
console.log('=================================');

async function runExample() {
  // 1. Create settings configuration using the builder pattern
  console.log('\n📋 1. Creating Settings Configuration...');
  
  // Create settings configuration step by step
  const builder = new SettingsBuilder();
  
  // Define all settings first
  builder.setting('graphics.quality')
    .select('Graphics Quality', 'Set the overall graphics quality', [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Ultra', value: 'ultra' }
    ], 'Graphics')
    .defaultValue('high')
    
  .setting('graphics.vsync')
    .toggle('V-Sync', 'Eliminate screen tearing', 'Graphics')
    .defaultValue(true)
    
  .setting('audio.enabled')
    .toggle('Audio Enabled', 'Enable all audio', 'Audio')
    .defaultValue(true)
    
  .setting('audio.volume')
    .slider('Master Volume', 'Overall audio volume', 0, 100, 1, '%', 'Audio')
    .defaultValue(50)
    .dependsOn(RelevanceTemplates.dependsOn('audio.enabled'))
    
  .setting('user.name')
    .input('Player Name', 'Your display name', 'User')
    .defaultValue('Player')
    .schema(z.string().min(1).max(20))
    
  // Define UI structure separately  
  .tab('graphics', 'Graphics', '🎨')
    .group('Settings')
      .settings(['graphics.quality', 'graphics.vsync'])
      
  .tab('audio', 'Audio', '🔊')
    .group('General')
      .settings(['audio.enabled', 'audio.volume'])
      
  .tab('user', 'User', '👤')
    .group('Profile')
      .settings(['user.name']);
      
  const config = builder.buildWithValidation();

  console.log(`✅ Created ${config.definitions.length} settings across ${config.structure.tabs.length} tabs`);

  // 2. Create store with memory storage
  console.log('\n🗄️  2. Setting up Store...');
  
  const store = createSettingsStore({
    storage: new MemoryStorageAdapter({ prefix: 'example:' }),
    debug: true,
    throttleMs: 50
  });

  // Register all setting controllers
  for (const definition of config.definitions) {
    store.getState().registerController({
      ...definition,
      title: definition.ui?.title || definition.key,
      description: definition.ui?.description || '',
      category: definition.ui?.category
    });
  }

  // Set initial values from defaults
  const initialValues = config.definitions.reduce((acc, def) => {
    acc[def.key] = def.defaultValue;
    return acc;
  }, {} as Record<string, any>);
  
  await store.getState().setValues(initialValues);

  console.log('✅ Store initialized with default values');

  // 3. Demonstrate value setting and retrieval
  console.log('\n💾 3. Setting and Getting Values...');
  
  await store.getState().setValue('graphics.quality', 'ultra');
  await store.getState().setValue('audio.volume', 80);
  await store.getState().setValue('user.name', 'John Doe');

  // Wait for throttled updates to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  const state = store.getState();
  console.log('Graphics Quality:', state.values['graphics.quality']);
  console.log('Audio Volume:', state.values['audio.volume']);
  console.log('User Name:', state.values['user.name']);

  // 4. Demonstrate relevance/conditional logic
  console.log('\n🔗 4. Testing Relevance Logic...');
  
  console.log('Audio enabled - dependent settings should be relevant:');
  const audioVolumeRelevant = config.definitions
    .find(d => d.key === 'audio.volume')?.isRelevant?.(state.values);
  console.log('  audio.volume relevant:', audioVolumeRelevant);

  // Disable audio and test relevance
  await store.getState().setValue('audio.enabled', false);
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for throttled update
  
  const newState = store.getState();
  console.log('\nAudio disabled - dependent settings should not be relevant:');
  const audioVolumeRelevantAfter = config.definitions
    .find(d => d.key === 'audio.volume')?.isRelevant?.(newState.values);
  console.log('  audio.volume relevant:', audioVolumeRelevantAfter);

  // 5. Demonstrate validation
  console.log('\n✅ 5. Testing Validation...');
  
  try {
    await store.getState().setValue('user.name', ''); // Should fail validation
  } catch (error) {
    console.log('✅ Validation correctly rejected empty name');
  }

  try {
    await store.getState().setValue('user.name', 'ThisNameIsTooLongForValidation'); // Should fail
  } catch (error) {
    console.log('✅ Validation correctly rejected name that is too long');
  }

  // 6. Reset functionality
  console.log('\n🔄 6. Testing Reset Functionality...');
  
  await store.getState().setValue('graphics.quality', 'low');
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for update
  console.log('Changed graphics quality to:', store.getState().values['graphics.quality']);
  
  await store.getState().resetToDefault('graphics.quality');
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for reset update
  
  console.log('Reset graphics quality to:', store.getState().values['graphics.quality']);

  // 7. Show final state
  console.log('\n📊 7. Final Settings State:');
  const finalState = store.getState();
  console.log('All values:', JSON.stringify(finalState.values, null, 2));

  console.log('\n🎉 Example completed successfully!');
  console.log('\nThe Pitz library provides:');
  console.log('  ✅ Framework-agnostic settings management');
  console.log('  ✅ Type-safe configuration with Zod validation');
  console.log('  ✅ Conditional settings with relevance logic');
  console.log('  ✅ Multiple storage adapters (Memory, LocalStorage, IndexedDB)');
  console.log('  ✅ Builder pattern for easy configuration');
  console.log('  ✅ Throttled updates for performance');
  console.log('  ✅ Full TypeScript support');
}

// Run the example
runExample().catch(console.error);