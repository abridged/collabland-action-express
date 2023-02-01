// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/common
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import fetch, { Headers } from "cross-fetch";
import HttpErrors from "http-errors";
import { URL } from "url";

export * from "cross-fetch";
export { default as HttpErrors } from "http-errors";
import debug from "debug";
/**
 * Module dependencies.
 */

const log = debug("collab-hello-action-express:server");

/**
 * Http client using `cross-fetch` for browser and Node.js
 */

export type FetchResponseOptions = {
  customErrorMessage?: string;
  timeout?: number;
  bodyLimit?: number;
  handlesBom?: boolean;
};

function normalizeString(content: string) {
  if (content.charCodeAt(0) === 65533) {
    return Buffer.from(content.slice(2), "utf-8").toString("utf16le");
  }
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

/**
 * Process fetch http response
 * @param res - Response object
 * @param expectedStatusCode - Expected status code
 * @param errMsg - Error message if status code does not satisfy
 */
export async function handleFetchResponse<T = unknown>(
  res: Response,
  expectedStatusCode: number | number[] = [200, 201, 204],
  options: FetchResponseOptions = {}
) {
  let body = await res.text();

  if (options.bodyLimit != null && body.length > options.bodyLimit) {
    throw new HttpErrors.PayloadTooLarge(
      `Payload size ${body.length} is too large. The limit is ${options.bodyLimit}.`
    );
  }

  body = options.handlesBom ? normalizeString(body) : body;

  const headers: Record<string, string> = {};
  res.headers.forEach((val, key) => {
    headers[key] = val;
  });
  log("Fetch response: %s %d %O %O", res.url, res.status, headers, body);

  let payload: any = body;
  try {
    const contentType = res.headers.get("content-type");
    if (contentType?.startsWith("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(body);
      const data: Record<string, string> = {};
      params.forEach((value, name) => {
        data[name] = value;
      });
      payload = data;
    } else {
      payload = JSON.parse(body);
    }
  } catch (err) {
    // Ignore err;
  }
  if (!Array.isArray(expectedStatusCode)) {
    expectedStatusCode = [expectedStatusCode];
  }
  if (!expectedStatusCode.includes(res.status)) {
    const errMsg = options?.customErrorMessage ?? `Fails to access ${res.url}`;
    const err = HttpErrors(res.status, errMsg);
    err.details = payload;
    log("Error response: %O", err);
    throw err;
  }
  log("Normal response: %O", payload);
  return payload as unknown as T;
}

/**
 * Invoker for `fetch`
 */
export type InvokeFetch = (
  reqInfo?: RequestInfo,
  reqInit?: RequestInit
) => Promise<Response>;

/**
 * Interceptor for `fetch`
 */
export type FetchInterceptor = (
  next: InvokeFetch,
  info: RequestInfo | URL,
  init: RequestInit
) => Promise<Response>;

/**
 * Options to get an instance of `Fetch`
 */
export interface FetchOptions extends RequestInit {
  /**
   * An interceptor function that intercepts `fetch`
   */
  interceptor?: FetchInterceptor;
  /**
   * Optional access token
   */
  accessToken?: string;

  timeout?: number;
}

/**
 * Merge http request headers for fetch
 * @param headersList - A list of headers
 * @returns
 */
export function mergeHeaders(...headersList: (HeadersInit | undefined)[]) {
  const result = new Headers();
  for (const h of headersList) {
    const headers = new Headers(h);
    headers.forEach((v, k) => {
      result.set(k, v);
    });
  }
  return result;
}

/**
 * Get an http client given options
 * @param options - Fetch options
 */
export function getFetch(options: FetchOptions = { method: "get" }) {
  const client: typeof fetch = async (input, init) => {
    const defaultHeaders = {
      Accept: "application/json, */*",
      "Content-Type": "application/json",
    };
    init = { ...init };
    const auth = handleAccessToken({ accessToken: options.accessToken });
    init.headers = mergeHeaders(
      defaultHeaders, // Default headers
      options.headers, // headers from `options`
      auth.headers, // Authorization header
      init?.headers // Headers from `init`
    );
    let timer: NodeJS.Timer;
    if (options.timeout) {
      const abortController = new AbortController();
      options = { signal: abortController.signal, ...options };
      timer = setTimeout(() => abortController.abort(), options.timeout);
    }
    init = {
      method: "GET",
      ...options,
      ...init,
    };
    log("Fetch request: %s %O %O", init.method, input, init);
    if (options.interceptor) {
      const next = (reqInfo?: RequestInfo, reqInit?: RequestInit) =>
        fetch(reqInfo ?? input, reqInit ?? init);
      return options.interceptor(next, input, init);
    }
    return fetch(input, init).finally(() => clearTimeout(timer));
  };
  return client;
}

/**
 * Get an http client with access token or authorization header
 * @param accessToken - Access token or authorization header
 * @param options - Got options
 */
export function getFetchWithAuth(
  accessToken: string,
  options: FetchOptions = {}
) {
  log("Access token %s", accessToken);
  if (accessToken == null) {
    throw new HttpErrors.BadRequest("Access token is missing");
  }

  const client = getFetch({
    ...options,
    accessToken,
  });
  return client;
}

export interface JsonRpcResponse<T = object> {
  jsonrpc: "2.0";
  result?: T;
  error?: object;
  id: number;
}

/**
 * Invoke a json-rpc 2.0 method
 * @param url - URL of the json-rpc endpoint
 * @param method - Method name
 * @param params - An array of parameters
 * @param options - Http client options
 */
export async function invokeJsonRpcFetch<T>(
  url: string,
  method: string,
  params: unknown[],
  options: FetchOptions = {}
) {
  const req: RequestInit = {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
    method: "POST",
  };

  const client = getFetch(req);
  const res = await client(url);

  const body = await handleFetchResponse<JsonRpcResponse<T>>(res, 200, {
    customErrorMessage: `POST ${url}`,
  });
  if (body.error) {
    const errorObj = JSON.stringify(body.error, null, 2);
    const err = new HttpErrors.BadRequest(
      `JSONRPC Error - ${url}: ${errorObj}`
    );
    err.details = body.error;
    throw err;
  }
  return body.result as T;
}

/**
 * Inspect options and map access token to `Authorization` header
 * @param options
 */
function handleAccessToken(options: FetchOptions) {
  const accessToken = options.accessToken;
  if (accessToken != null) {
    const authHeader = accessToken.includes(" ")
      ? accessToken
      : "Bearer " + accessToken;
    options = { ...options };
    options.headers = { ...options.headers, Authorization: authHeader };
  }
  return options;
}

/**
 * Create a basic authorization header
 * @param id - Client id or user name
 * @param secret - Client secret or password
 * @returns
 */
export function buildBasicAuthHeader(id = "", secret = "", scheme = "Basic") {
  return `${scheme} ` + Buffer.from(`${id}:${secret}`).toString("base64");
}
