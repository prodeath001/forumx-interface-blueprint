import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

/**
 * Formats a number into a string with K (thousands) or M (millions) suffix.
 * Example: 12345 -> 12.3K, 1234567 -> 1.2M
 */
export function formatMembers(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}
