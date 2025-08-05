import { Command } from '../../src/interfaces/application/Command';

export interface MockEventWithCommand {
    command?: Command;
    getOption?: (name: string) => any;
    selected?: string;
    deferReplyAsync?: () => Promise<void>;
    sendAsync?: () => Promise<void>;
    replyAsync?: () => Promise<void>;
    [key: string]: any;
}
