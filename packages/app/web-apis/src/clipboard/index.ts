/**
 * Checks if the Clipboard API is available in the browser.
 * Note: Access to clipboard methods may require user permission and a secure context (HTTPS).
 * @returns `true` if `navigator.clipboard` exists, `false` otherwise.
 */
export function isClipboardSupported(): boolean {
  return navigator.clipboard !== undefined;
}

/**
 * Writes text to the system clipboard.
 * Requires user permission and a secure context.
 *
 * @param text The string to write to the clipboard.
 * @returns A Promise that resolves when the text is successfully written, or rejects if it fails.
 */
export async function writeTextToClipboard(text: string): Promise<void> {
  if (!isClipboardSupported()) {
    return Promise.reject(new Error("Clipboard API is not supported."));
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to write text to clipboard:", err);
    throw err; // Re-throw after logging
  }
}

/**
 * Reads text from the system clipboard.
 * Requires user permission and a secure context.
 *
 * @returns A Promise that resolves with the text content from the clipboard, or rejects if it fails.
 */
export async function readTextFromClipboard(): Promise<string> {
  if (!isClipboardSupported()) {
    return Promise.reject(new Error("Clipboard API is not supported."));
  }
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (err) {
    console.error("Failed to read text from clipboard:", err);
    throw err; // Re-throw after logging
  }
}
