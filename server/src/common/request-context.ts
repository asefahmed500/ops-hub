import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
  requestId: string;
  userId?: string;
  userName?: string;
  tenantId?: string;
  role?: string;
}

/** Per-request context created by middleware; the auth guard fills in actor + tenant. */
export const requestContext = new AsyncLocalStorage<RequestContextStore>();
