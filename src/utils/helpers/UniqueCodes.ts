import * as crypto from 'crypto';

export class UniqueCodes {
    public static generateCode(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    public static generateUUID(): string {
        return crypto.randomUUID();
    }

    public static generateTimestampCode(): string {
        const timestamp = Date.now().toString(36);
        const randomBytes = crypto.randomBytes(4).toString('hex');
        return `${timestamp}-${randomBytes}`;
    }
}

