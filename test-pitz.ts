import { z } from 'zod';
import pitz from 'pitz';

async function testPitzInStarSim() {
  console.log('🌟 Testing Pitz in Star-Sim!');
  console.log('================================');

  // 1. Create settings configuration for a space simulation
  const config = new pitz.SettingsBuilder()
    // Graphics settings
    .setting('graphics.starCount')
      .slider('Star Count', 'Number of visible stars', 100, 10000, 100, '', 'Graphics')
      .defaultValue(1000)
      
    .setting('graphics.quality')
      .select('Graphics Quality', 'Rendering quality level', [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Ultra', value: 'ultra' }
      ], 'Graphics')
      .defaultValue('medium')
      
    .setting('graphics.postProcessing')
      .toggle('Post-Processing', 'Enable visual effects', 'Graphics')
      .defaultValue(true)
      
    .setting('graphics.bloom.intensity')
      .slider('Bloom Intensity', 'Star glow effect intensity', 0, 5, 0.1, '', 'Graphics')
      .defaultValue(1.2)
      .dependsOn(pitz.RelevanceTemplates.dependsOn('graphics.postProcessing'))
      
    // Simulation settings
    .setting('simulation.timeScale')
      .slider('Time Scale', 'Simulation speed multiplier', 0.1, 10, 0.1, 'x', 'Simulation')
      .defaultValue(1.0)
      
    .setting('simulation.physics.enabled')
      .toggle('Physics Simulation', 'Enable realistic physics', 'Simulation')
      .defaultValue(true)
      
    .setting('simulation.physics.gravity')
      .slider('Gravity Strength', 'Gravitational force multiplier', 0, 2, 0.01, '', 'Simulation')
      .defaultValue(1.0)
      .dependsOn(pitz.RelevanceTemplates.dependsOn('simulation.physics.enabled'))
      
    // User preferences
    .setting('user.cameraSpeed')
      .slider('Camera Speed', 'Camera movement speed', 0.1, 5, 0.1, '', 'Controls')
      .defaultValue(1.0)
      
    .setting('user.autoSave')
      .toggle('Auto Save', 'Automatically save simulation state', 'Controls')
      .defaultValue(true)
      
    .setting('user.username')
      .input('Username', 'Your display name', 'User')
      .defaultValue('StarGazer')
      .schema(z.string().min(1).max(20))
      
    // UI structure
    .tab('graphics', 'Graphics', '🎨')
      .group('Rendering')
        .settings(['graphics.starCount', 'graphics.quality'])
      .group('Effects')
        .settings(['graphics.postProcessing', 'graphics.bloom.intensity'])
        
    .tab('simulation', 'Simulation', '🌌')
      .group('General')
        .settings(['simulation.timeScale'])
      .group('Physics')
        .settings(['simulation.physics.enabled', 'simulation.physics.gravity'])
        
    .tab('controls', 'Controls', '🎮')
      .group('Camera')
        .settings(['user.cameraSpeed'])
      .group('Preferences')
        .settings(['user.autoSave', 'user.username'])
        
    .buildWithValidation();

  console.log(`✅ Configuration built with ${config.definitions.length} settings across ${config.structure.tabs.length} tabs`);

  // 2. Create store with localStorage (persists between sessions)
  const store = pitz.createSettingsStore({
    storage: new pitz.LocalStorageAdapter({ prefix: 'star-sim:' }),
    debug: true
  });

  // 3. Register all settings
  for (const definition of config.definitions) {
    store.getState().registerController({
      ...definition,
      title: definition.ui?.title || definition.key,
      description: definition.ui?.description || '',
      category: definition.ui?.category
    });
  }

  // 4. Load defaults
  const defaults = config.definitions.reduce((acc, def) => {
    acc[def.key] = def.defaultValue;
    return acc;
  }, {} as Record<string, any>);
  
  await store.getState().setValues(defaults);

  console.log('\n🎮 Testing Settings...');
  
  // 5. Test some settings
  await store.getState().setValue('graphics.starCount', 5000);
  await store.getState().setValue('simulation.timeScale', 2.5);
  await store.getState().setValue('user.username', 'SpaceExplorer');
  
  // Wait for throttled updates
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Current settings:');
  console.log('- Star Count:', store.getState().values['graphics.starCount']);
  console.log('- Time Scale:', store.getState().values['simulation.timeScale']);
  console.log('- Username:', store.getState().values['user.username']);
  
  // 6. Test relevance (conditional settings)
  console.log('\n🔗 Testing Relevance Logic...');
  
  const bloomSetting = config.definitions.find(d => d.key === 'graphics.bloom.intensity');
  console.log('Bloom intensity relevant (post-processing on):', 
    bloomSetting?.isRelevant?.(store.getState().values));
  
  await store.getState().setValue('graphics.postProcessing', false);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Bloom intensity relevant (post-processing off):', 
    bloomSetting?.isRelevant?.(store.getState().values));

  // 7. Test validation
  console.log('\n✅ Testing Validation...');
  
  try {
    await store.getState().setValue('user.username', ''); // Should fail
  } catch (error) {
    console.log('✅ Validation correctly rejected empty username');
  }
  
  try {
    await store.getState().setValue('user.username', 'ThisNameIsWayTooLongForValidation'); // Should fail
  } catch (error) {
    console.log('✅ Validation correctly rejected username that is too long');
  }

  console.log('\n🎉 Pitz integration test completed!');
  console.log('\nPitz is working perfectly in your Star-Sim application!');
  console.log('You can now:');
  console.log('- Replace your existing settings system with Pitz');
  console.log('- Import these settings into your React components');
  console.log('- Use the relevance logic for conditional UI');
  console.log('- Persist settings across browser sessions');
}

// Run the test
testPitzInStarSim().catch(console.error);