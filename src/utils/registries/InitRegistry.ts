const registrations: Array<() => Promise<void>> = [];

export function registerInit(fn: () => Promise<void>): void {
    registrations.push(fn);
}

export async function initAsync(): Promise<void> {
    for (const fn of registrations) {
        await fn();
    }
}

export function RegisterInit() {
    return function <T extends new (...args: any[]) => {}>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                if (typeof (this as any).initAsync === 'function') {
                    registerInit(() => (this as any).initAsync());
                }
            }
        };
    };
}
