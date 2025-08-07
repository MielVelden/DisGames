import { GamesModel } from '../../src/interfaces/database/TableInterfaces';
import { Component, ComponentType } from '../../src/interfaces/application/Message';
import Logger from '../../src/utils/Logger';
import { ExceptionEnum } from '../../src/interfaces/enums';
import { ComponentError } from '../../src/utils/ErrorHelper';
import { GameFlowTestResult } from '../interfaces/GameFlowInterface';
import { TrackedMessage, TrackedReaction } from '../interfaces/InputQueueInterface';

export class AssertionError extends Error {
    constructor(message: string, expected?: any, actual?: any) {
        super(message);
        this.name = 'AssertionError';
        
        if (expected !== undefined && actual !== undefined) {
            this.message += `\nExpected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`;
        }
    }
}

export class AssertionHelpers {
    public static assertEqual<T>(actual: T, expected: T, message?: string): void {
        if (actual !== expected) {
            const msg = message || `Expected values to be equal`;
            throw new AssertionError(msg, expected, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'values are equal'}`);
    }

    public static assertNotEqual<T>(actual: T, expected: T, message?: string): void {
        if (actual === expected) {
            const msg = message || `Expected values to be different`;
            throw new AssertionError(msg, `not ${expected}`, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'values are different'}`);
    }

    public static assertTrue(actual: boolean, message?: string): void {
        if (actual !== true) {
            const msg = message || `Expected value to be true`;
            throw new AssertionError(msg, true, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'value is true'}`);
    }

    public static assertFalse(actual: boolean, message?: string): void {
        if (actual !== false) {
            const msg = message || `Expected value to be false`;
            throw new AssertionError(msg, false, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'value is false'}`);
    }

    public static assertNotNull<T>(actual: T | null | undefined, message?: string): void {
        if (actual === null || actual === undefined) {
            const msg = message || `Expected value to not be null or undefined`;
            throw new AssertionError(msg, 'not null/undefined', actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'value is not null'}`);
    }

    public static assertNull<T>(actual: T | null | undefined, message?: string): void {
        if (actual !== null && actual !== undefined) {
            const msg = message || `Expected value to be null or undefined`;
            throw new AssertionError(msg, null, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'value is null'}`);
    }

    public static assertContains<T>(array: T[], item: T, message?: string): void {
        if (!array.includes(item)) {
            const msg = message || `Expected array to contain item`;
            throw new AssertionError(msg, `array containing ${item}`, array);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || 'array contains item'}`);
    }

    public static assertArrayLength<T>(array: T[], expectedLength: number, message?: string): void {
        if (array.length !== expectedLength) {
            const msg = message || `Expected array length to be ${expectedLength}`;
            throw new AssertionError(msg, expectedLength, array.length);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || `array length is ${expectedLength}`}`);
    }

    public static assertGreaterThan(actual: number, expected: number, message?: string): void {
        if (actual <= expected) {
            const msg = message || `Expected ${actual} to be greater than ${expected}`;
            throw new AssertionError(msg, `> ${expected}`, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || `${actual} > ${expected}`}`);
    }

    public static assertLessThan(actual: number, expected: number, message?: string): void {
        if (actual >= expected) {
            const msg = message || `Expected ${actual} to be less than ${expected}`;
            throw new AssertionError(msg, `< ${expected}`, actual);
        }
        Logger.logInfo(`✓ Assertion passed: ${message || `${actual} < ${expected}`}`);
    }

    // Game-specific assertions
    public static assertGameExists(game: GamesModel | null, message?: string): void {
        this.assertNotNull(game, message || 'Game should exist');
    }

    public static assertGameState(game: GamesModel, expectedState: Partial<GamesModel>, message?: string): void {
        this.assertNotNull(game, 'Game should exist');
        
        for (const [key, expectedValue] of Object.entries(expectedState)) {
            const actualValue = (game as any)[key];
            this.assertEqual(actualValue, expectedValue, message || `Game property ${key} should match`);
        }
    }

    public static assertGameFlowSuccess(result: GameFlowTestResult, message?: string): void {
        this.assertTrue(result.success, message || 'Game flow should succeed');
        this.assertNotNull(result.game, 'Game should be created');
        this.assertEqual(result.errors.length, 0, 'Game flow should have no errors');
    }

    public static assertGameFlowFailure(result: GameFlowTestResult, expectedErrorCount?: number, message?: string): void {
        this.assertFalse(result.success, message || 'Game flow should fail');
        if (expectedErrorCount !== undefined) {
            this.assertEqual(result.errors.length, expectedErrorCount, 'Should have expected number of errors');
        } else {
            this.assertGreaterThan(result.errors.length, 0, 'Should have at least one error');
        }
    }

    public static assertComponentType(component: Component, expectedType: ComponentType, message?: string): void {
        this.assertEqual(component.type, expectedType, message || `Component should be of type ${ComponentType[expectedType]}`);
    }

    public static assertComponentsContainType(components: Component[], expectedType: ComponentType, message?: string): void {
        const hasType = components.some(component => component.type === expectedType);
        this.assertTrue(hasType, message || `Components should contain type ${ComponentType[expectedType]}`);
    }

    public static assertMessagesContainText(messages: Component[][], searchText: string, message?: string): void {
        const containsText = messages.some(messageGroup => 
            messageGroup.some(component => 
                JSON.stringify(component).toLowerCase().includes(searchText.toLowerCase())
            )
        );
        this.assertTrue(containsText, message || `Messages should contain text: "${searchText}"`);
    }

    public static assertTimelineEntryExists(timeline: any[], entryType: string, message?: string): void {
        const hasEntry = timeline.some(entry => entry.type === entryType);
        this.assertTrue(hasEntry, message || `Timeline should contain entry of type: ${entryType}`);
    }

    // Async assertion helper
    public static async assertThrowsAsync(asyncFn: () => Promise<any>, expectedErrorType?: ExceptionEnum, message?: string): Promise<void> {
        try {
            await asyncFn();
            throw new AssertionError(message || 'Expected function to throw an error');
        } catch (error) {
            if (expectedErrorType && (!(error instanceof ComponentError) || error.errorKey !== expectedErrorType)) {
                const actualErrorType = error instanceof ComponentError ? 
                    error.errorKey : 
                    (error as Error).constructor.name;
                    
                throw new AssertionError(
                    message || `Expected error of type ${expectedErrorType}`,
                    expectedErrorType,
                    actualErrorType
                );
            }
            Logger.logInfo(`✓ Assertion passed: ${message || 'function threw expected error'}`);
        }
    }

    public static async assertDoesNotThrowAsync(asyncFn: () => Promise<any>, message?: string): Promise<void> {
        try {
            await asyncFn();
            Logger.logInfo(`✓ Assertion passed: ${message || 'function did not throw'}`);
        } catch (error) {
            throw new AssertionError(message || 'Expected function to not throw an error', 'no error', error);
        }
    }

    // Message and Reaction tracking assertions
    public static assertMessageExists(messages: TrackedMessage[], channelId: string, message?: string): void {
        const hasMessage = messages.some(msg => msg.channelId === channelId);
        this.assertTrue(hasMessage, message || `Expected message to exist in channel ${channelId}`);
    }

    public static assertMessageContainsText(messages: TrackedMessage[], searchText: string, message?: string): void {
        const containsText = messages.some(msg => 
            JSON.stringify(msg.content).toLowerCase().includes(searchText.toLowerCase())
        );
        this.assertTrue(containsText, message || `Expected messages to contain text: "${searchText}"`);
    }

    public static assertMessageCount(messages: TrackedMessage[], expectedCount: number, message?: string): void {
        this.assertEqual(messages.length, expectedCount, message || `Expected ${expectedCount} messages`);
    }

    public static assertReactionExists(reactions: TrackedReaction[] | undefined, emoji: string, messageId?: string, message?: string): void {
        if(!reactions)
            throw new AssertionError(message || `Expected reactions to exist`);

        const reactionExists = reactions.some(reaction => 
            reaction.emoji === emoji && 
            reaction.isAdd && 
            (!messageId || reaction.messageId === messageId)
        );
        this.assertTrue(reactionExists, message || `Expected reaction ${emoji} to exist${messageId ? ` on message ${messageId}` : ''}`);
    }

    public static assertReactionCount(reactions: TrackedReaction[] | undefined, emoji: string, expectedCount: number, message?: string): void {
        if(!reactions)
            throw new AssertionError(message || `Expected reactions to exist`);

        const reactionCount = reactions.filter(reaction => reaction.emoji === emoji && reaction.isAdd).length;
        this.assertEqual(reactionCount, expectedCount, message || `Expected ${expectedCount} reactions with emoji ${emoji}`);
    }

    public static assertNoReactionExists(reactions: TrackedReaction[] | undefined, emoji: string, messageId?: string, message?: string): void {
        if(!reactions)
            throw new AssertionError(message || `Expected reactions to exist`);

        const reactionExists = reactions.some(reaction => 
            reaction.emoji === emoji && 
            reaction.isAdd && 
            (!messageId || reaction.messageId === messageId)
        );
        this.assertFalse(reactionExists, message || `Expected no reaction ${emoji}${messageId ? ` on message ${messageId}` : ''}`);
    }

    public static assertMessageWasEdited(messages: TrackedMessage[], messageId: string, message?: string): void {
        const wasEdited = messages.some(msg => msg.id === messageId && msg.isEdit);
        this.assertTrue(wasEdited, message || `Expected message ${messageId} to be edited`);
    }

    public static assertMessageWasNotEdited(messages: TrackedMessage[], messageId: string, message?: string): void {
        const wasEdited = messages.some(msg => msg.id === messageId && msg.isEdit);
        this.assertFalse(wasEdited, message || `Expected message ${messageId} not to be edited`);
    }
}

// Export individual assertion functions for convenience
export const {
    assertEqual,
    assertNotEqual,
    assertTrue,
    assertFalse,
    assertNotNull,
    assertNull,
    assertContains,
    assertArrayLength,
    assertGreaterThan,
    assertLessThan,
    assertGameExists,
    assertGameState,
    assertGameFlowSuccess,
    assertGameFlowFailure,
    assertComponentType,
    assertComponentsContainType,
    assertMessagesContainText,
    assertTimelineEntryExists,
    assertThrowsAsync,
    assertDoesNotThrowAsync,
    assertMessageExists,
    assertMessageContainsText,
    assertMessageCount,
    assertReactionExists,
    assertReactionCount,
    assertNoReactionExists,
    assertMessageWasEdited,
    assertMessageWasNotEdited,
} = AssertionHelpers;

export default AssertionHelpers;