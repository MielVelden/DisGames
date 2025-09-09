export interface JobModule {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    cronExpression: string;
    handler: () => Promise<void>;
}
