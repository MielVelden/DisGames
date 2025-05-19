import { Repository } from "../interfaces/Repository";
import { Server } from "../interfaces/Server";
import { Language } from "../interfaces/Language";

export class ServerRepository implements Repository<Server> {
    async getByIDAsync(id: string): Promise<Server> {
        throw new Error("Method not implemented.");
    }
    async getAllAsync(): Promise<Server[]> {
        throw new Error("Method not implemented.");
    }
    async saveAsync(data: Server): Promise<Server> {
        throw new Error("Method not implemented.");
    }
    async purgeAsync(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async getLanguageAsync(id: string): Promise<Language> {
        throw new Error("Method not implemented.");
    }
}