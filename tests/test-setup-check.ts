#!/usr/bin/env ts-node

import { TestDiscordEventBuilder } from './builders/TestDiscordEventBuilder';
import { TestInputSimulator } from './builders/TestInputSimulator';
import { GameFlowTestHelper } from './helpers/GameFlowTestHelper';
import { AssertionHelpers } from './helpers/AssertionHelpers';
import TestConfig from './config/TestConfig';

console.log('🧪 Testing DisGames Test Architecture Setup');
console.log('==========================================');

try {
    // Test basic imports
    console.log('✅ All core imports loaded successfully');
    
    // Test TestDiscordEventBuilder
    const eventBuilder = TestDiscordEventBuilder.create();
    const event = eventBuilder.buildSlashCommandEvent('test');
    console.log('✅ TestDiscordEventBuilder works');
    
    // Test TestInputSimulator
    const simulator = TestInputSimulator.create()
        .expectInput('test')
        .expectConfirmation(true);
    console.log('✅ TestInputSimulator works');
    
    // Test GameFlowTestHelper
    const helper = new GameFlowTestHelper();
    console.log('✅ GameFlowTestHelper instantiated');
    
    // Test AssertionHelpers
    AssertionHelpers.assertEqual(1, 1, 'Basic assertion test');
    console.log('✅ AssertionHelpers work');
    
    // Test Config
    const config = TestConfig.environment;
    console.log(`✅ TestConfig loaded - Test mode: ${config.isTestMode}`);
    
    console.log('\n🎉 All tests passed! Test architecture is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Set up .env.test with your test database');
    console.log('2. Run: npm test');
    console.log('3. Check examples in tests/examples/');
    
} catch (error) {
    console.error('❌ Setup check failed:', error);
    process.exit(1);
}