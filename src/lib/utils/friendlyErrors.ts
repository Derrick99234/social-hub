/**
 * Translates raw API and GraphQL error messages into clear, human-readable explanations.
 */
export function formatFriendlyErrorMessage(rawError?: string | null): string {
  if (!rawError || typeof rawError !== 'string') {
    return 'An unexpected error occurred during dispatch. Please click Retry.';
  }

  const err = rawError.trim();

  // 1. LinkedIn / Platform Duplicate Protection
  if (
    err.includes("already got this one scheduled") ||
    err.includes("post the same thing twice") ||
    err.includes("duplicate") ||
    err.includes("Duplicate")
  ) {
    return 'Duplicate post prevented: This exact content was already published to this account. Social networks prevent posting the identical text twice in close succession. Slightly modify your text or try again later.';
  }

  // 2. Instagram Formatting / Type Requirements
  if (
    err.includes("Instagram posts require a type") ||
    err.includes("post, story, or reel")
  ) {
    return 'Instagram requires a post type: Feed post configuration has been automatically updated. Please click Retry to publish.';
  }

  // 3. Media / Asset Input Errors
  if (
    err.includes("AssetInput") ||
    err.includes("assets[") ||
    err.includes("OneOf type")
  ) {
    return 'Media format error: The platform could not process the attached image format. Please remove and re-upload the image, then retry.';
  }

  // 4. Missing Tokens / Unconfigured Keys
  if (
    err.includes("No live token/profile configured") ||
    err.includes("No live API key configured") ||
    err.includes("not configured")
  ) {
    return 'Account not connected: No active API key or access token found. Please add your credentials in Settings to publish to this profile.';
  }

  // 5. Authentication / Expired Credentials
  if (
    err.includes("401") ||
    err.toLowerCase().includes("unauthorized") ||
    err.toLowerCase().includes("invalid token") ||
    err.toLowerCase().includes("token expired")
  ) {
    return 'Authentication error: The access token has expired or is invalid. Please refresh or re-enter your API key in Settings.';
  }

  // 6. Permissions / Page Access
  if (
    err.includes("403") ||
    err.toLowerCase().includes("forbidden") ||
    err.toLowerCase().includes("permission") ||
    err.toLowerCase().includes("not authorized")
  ) {
    return 'Permission denied: Your account does not have sufficient admin permissions to publish to this company page or profile.';
  }

  // 7. Rate Limits / Quotas
  if (
    err.includes("429") ||
    err.includes("LimitReachedError") ||
    err.toLowerCase().includes("rate limit") ||
    err.toLowerCase().includes("too many requests")
  ) {
    return 'Publishing limit reached: You have reached the API post limit for this platform today. Please wait a short while before retrying.';
  }

  // 8. Network / Gateway Errors
  if (
    err.toLowerCase().includes("fetch failed") ||
    err.toLowerCase().includes("network error") ||
    err.toLowerCase().includes("timeout") ||
    err.includes("502") ||
    err.includes("503") ||
    err.includes("504")
  ) {
    return 'Network timeout: The social platform did not respond in time. Your post was not lost; please click Retry.';
  }

  // Return clean trimmed string without programmatic stack traces
  return err.length > 250 ? err.slice(0, 250) + '...' : err;
}
