import { ServerRepository } from './ServerRepository';

export class RepositoryProvider {
    private static instance: RepositoryProvider;
        
    private constructor() {
        this.serverRepository = new ServerRepository();
    }
    
    public static getInstance(): RepositoryProvider {
        if (!RepositoryProvider.instance) {
            RepositoryProvider.instance = new RepositoryProvider();
        }
        
        return RepositoryProvider.instance;
    }
    
    private serverRepository: ServerRepository;
    public getServerRepository(): ServerRepository { return this.serverRepository; }
    
} 