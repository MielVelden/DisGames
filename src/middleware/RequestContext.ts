import { AsyncLocalStorage } from "async_hooks";
import type { Request, Response } from "express";

type Store = { req: Request; res: Response; clientId?: string };

export const requestContext = new AsyncLocalStorage<Store>();

export function withRequestContext(req: Request, res: Response, next: () => void) {
    const clientId = req.header('X-WS-Client-Id') || 
                    req.header('x-ws-client-id') ||
                    (req.query.clientId as string);
    
    requestContext.run({ req, res, clientId }, () => next());
}

export function getRequest() {
    return requestContext.getStore()?.req;
}

export function getResponse() {
    return requestContext.getStore()?.res;
}

export function getClientId(): string | undefined {
    return requestContext.getStore()?.clientId;
}

