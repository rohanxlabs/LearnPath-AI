import Constants from "expo-constants";

export type ApiErrorShape = {
  error?: string;
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const mobileConfig = Constants.expoConfig?.extra?.mobile as
  Record<string, unknown> | undefined;

function readApiBaseUrl(
  config: Record<string, unknown> | undefined,
): string | null {
  const value = config?.apiUrl;
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue.replace(/\/+$/, "") : null;
}

const configuredBaseUrl = readApiBaseUrl(mobileConfig);

export function getApiBaseUrl() {
  return configuredBaseUrl || null;
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!configuredBaseUrl) {
    throw new ApiError(
      "API URL is not configured. Set EXPO_PUBLIC_API_URL to your LearnPath API origin and restart Expo.",
      0,
      "API_NOT_CONFIGURED",
    );
  }

  const { accessToken, body: requestBody, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let body: BodyInit | undefined;
  if (requestBody !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(requestBody);
  }

  const response = await fetch(
    `${configuredBaseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...fetchOptions,
      headers,
      body,
    },
  );
  const contentType = response.headers.get("content-type") || "";
  const responseBody = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const detail =
      responseBody && typeof responseBody === "object"
        ? (responseBody as ApiErrorShape)
        : {};
    throw new ApiError(
      detail.message || detail.error || `Request failed (${response.status}).`,
      response.status,
      detail.code,
    );
  }
  return responseBody as T;
}
