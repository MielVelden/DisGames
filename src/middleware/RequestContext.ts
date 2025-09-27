import { AsyncLocalStorage } from "async_hooks";
import type { Request, Response } from "express";

type Store = { req: Request; res: Response };

export const requestContext = new AsyncLocalStorage<Store>();

export function withRequestContext(req: Request, res: Response, next: () => void) {
    requestContext.run({ req, res }, () => next());
}

export function getRequest() {
    return requestContext.getStore()?.req;
}

export function getResponse() {
    return requestContext.getStore()?.res;
}

