import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lean relative time formatter using native Date arithmetic
export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '--';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
  if (mins === 0) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Resolves display name for a user's assigned barangay
export function getBarangayName(
  user?: { barangay?: unknown } | null,
  barangays: Array<{ id: string; name: string }> = []
): string {
  if (!user?.barangay) return 'Unknown Location';
  if (typeof user.barangay === 'object' && user.barangay !== null && 'name' in user.barangay) {
    return String((user.barangay as { name: string }).name);
  }
  if (typeof user.barangay === 'string') {
    const bId = user.barangay;
    const match = barangays.find((b) => b.id === bId || b.name === bId);
    return match ? match.name : bId;
  }
  return 'Unknown Location';
}
