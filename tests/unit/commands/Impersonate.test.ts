import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import ImpersonateCommand from '../../../src/commands/Impersonate';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { createTestUserAsync } from '../../fixtures/users';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';
import { OWNER_ID } from '../../../src/config';
import { MessageInteractionEvent } from '../../../src/interfaces/application/Event';

export default function registerImpersonateTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'ImpersonateCommand',
        description: 'Unit tests for Impersonate command functionality',
        
        setup: async () => {
        },
        
        teardown: async () => {
        },
        
        beforeEach: async () => {
        },
        
        afterEach: async () => {
        },
        
        tests: [
            {
                name: 'should allow execution for owner user',
                testFunction: async () => {
                    const testServer = await createTestServerAsync();
                    const ownerUser = await createTestUserAsync();
                    const testChannel = await createTestChannelAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: OWNER_ID || ownerUser.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: testChannel });
                    
                    const event = eventBuilder.buildMessageEvent('impersonate 123456789 test message') as MessageInteractionEvent;
                    
                    event.command = ImpersonateCommand;
                    
                    const canExecute = ImpersonateCommand.canExecute(event);
                    
                    if (!canExecute)
                        throw new Error('Owner user should be able to execute Impersonate command');
                }
            },
            
            {
                name: 'should deny execution for non-owner user',
                testFunction: async () => {
                    const testServer = await createTestServerAsync();
                    const regularUser = await createTestUserAsync();
                    const testChannel = await createTestChannelAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: regularUser.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: testChannel });
                    
                    const event = eventBuilder.buildMessageEvent('impersonate 123456789 "test message"') as MessageInteractionEvent;
                    
                    event.command = ImpersonateCommand;
                    
                    const canExecute = ImpersonateCommand.canExecute(event);
                    
                    if (canExecute)
                        throw new Error('Non-owner user should NOT be able to execute Impersonate command');
                }
            },
            
            {
                name: 'should deny execution when canExecute returns false',
                testFunction: async () => {
                    const testServer = await createTestServerAsync();
                    const regularUser = await createTestUserAsync();
                    const testChannel = await createTestChannelAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: regularUser.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: testChannel });
                    
                    const event = eventBuilder.buildMessageEvent('impersonate 123456789 "test message"') as MessageInteractionEvent;
                    
                    event.command = ImpersonateCommand;
                    
                    const canExecute = ImpersonateCommand.canExecute(event);
                    
                    if (canExecute)
                        throw new Error('Command should not execute when canExecute returns false');
                    
                    if (event.command.canExecute && event.command.canExecute(event))
                        throw new Error('Command execution should be blocked by canExecute check');
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}
