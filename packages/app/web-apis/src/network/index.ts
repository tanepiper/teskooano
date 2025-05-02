/**
 * Interface extending the standard RequestInit for potential custom options.
 */
export interface EnhancedRequestInit extends RequestInit {}

/**
 * A basic wrapper around the native fetch API.
 * Provides a potential point for future enhancements like default headers,
 * standardized error handling, automatic retries, or request timeouts.
 *
 * @param url The URL to fetch.
 * @param options Optional request configuration (EnhancedRequestInit).
 * @returns A Promise that resolves to the Response object.
 */
export async function enhancedFetch(
  url: string | URL | Request,
  options?: EnhancedRequestInit,
): Promise<Response> {
  if (typeof fetch === "undefined") {
    throw new Error("fetch API is not available in this environment.");
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);

    throw error;
  }
}
