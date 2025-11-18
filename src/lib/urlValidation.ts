/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || url.trim().length === 0) {
    return true; // Empty URLs are considered valid (optional field)
  }

  try {
    const urlObject = new URL(url.trim());
    // Check if protocol is http or https
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Gets a user-friendly error message for an invalid URL
 * @param url - The URL string to validate
 * @returns An error message if the URL is invalid, or null if valid
 */
export const getUrlValidationError = (url: string): string | null => {
  if (!url || url.trim().length === 0) {
    return null; // Empty is valid
  }

  const trimmedUrl = url.trim();

  // Check if it starts with http:// or https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return 'URL must start with http:// or https://';
  }

  // Try to parse the URL
  try {
    new URL(trimmedUrl);
    return null; // Valid URL
  } catch {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
};
