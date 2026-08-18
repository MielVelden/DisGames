export abstract class Service {
    static get serviceToken(): symbol {
        return Symbol.for(this.name);
    }

    abstract initAsync(): Promise<void>;
}
