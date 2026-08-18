const registrations: Array<() => Promise<void>> = [];

export function registerInit(fn: () => Promise<void>): void {
    registrations.push(fn);
}

export async function initAsync(): Promise<void> {
    for (const fn of registrations) {
        await fn();
    }
}
