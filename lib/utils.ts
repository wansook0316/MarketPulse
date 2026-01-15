import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr = 'yyyy-MM-dd HH:mm'
): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '-';

  return format(dateObj, formatStr, { locale: ko });
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '-';

  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('ko-KR').format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(
  num: number | null | undefined,
  decimals = 1
): string {
  if (num === null || num === undefined) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Pluralize word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Sleep helper for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate random ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
}

/**
 * Check if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if code is running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T | null = null
): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isClient()) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Get engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  retweets: number,
  replies: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  const engagement = likes + retweets + replies;
  return (engagement / impressions) * 100;
}

/**
 * Validate Twitter handle
 */
export function isValidTwitterHandle(handle: string): boolean {
  // Twitter handles are 1-15 characters, alphanumeric + underscore
  const regex = /^@?[A-Za-z0-9_]{1,15}$/;
  return regex.test(handle);
}

/**
 * Normalize Twitter handle (remove @ prefix)
 */
export function normalizeTwitterHandle(handle: string): string {
  return handle.startsWith('@') ? handle.substring(1) : handle;
}

/**
 * Get status badge color
 */
export function getStatusColor(
  status: string
): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'approved':
    case 'posted':
    case 'evaluated':
      return 'success';
    case 'pending':
    case 'pending_approval':
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'archived':
      return 'danger';
    default:
      return 'default';
  }
}

/**
 * Format Twitter handle with @ prefix
 */
export function formatTwitterHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`;
}
