export const currentApiVersion = "v1";
export const apiVersionHeader = "x-nestly-api-version";

export type ApiVersion = typeof currentApiVersion;

export function getApiRoute(path: string, version: ApiVersion = currentApiVersion) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/api/${version}${normalizedPath}`;
}

export function createVersionedApiResponseHeaders(version: ApiVersion = currentApiVersion) {
  return {
    [apiVersionHeader]: version,
  };
}

