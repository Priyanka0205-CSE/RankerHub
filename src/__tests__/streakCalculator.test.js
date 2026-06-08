import { describe, it, expect } from 'vitest';

// Core logic wrapper for testing - FIXED WITH UTC METHODS
const checkAndUpdateStreak = (lastLoginIso, currentLoginIso, currentStreak) => {
  const last = new Date(lastLoginIso);
  last.setUTCHours(0, 0, 0, 0); // Force UTC midnight to avoid local timezone drift

  const current = new Date(currentLoginIso);
  current.setUTCHours(0, 0, 0, 0); // Force UTC midnight

  const diffInDays = Math.round((current - last) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return { streak: currentStreak, updated: false };
  if (diffInDays === 1) return { streak: currentStreak + 1, updated: true };
  return { streak: 1, updated: true };
};

describe('Streak Calculator Logic', () => {
  it('should increment streak by 1 for a valid consecutive daily check-in', () => {
    const result = checkAndUpdateStreak('2026-06-01T10:00:00Z', '2026-06-02T10:00:00Z', 5);
    expect(result.streak).toBe(6);
    expect(result.updated).toBe(true);
  });

  it('should reset streak to 1 if a day is missed completely', () => {
    const result = checkAndUpdateStreak('2026-06-01T10:00:00Z', '2026-06-03T10:00:00Z', 5);
    expect(result.streak).toBe(1);
    expect(result.updated).toBe(true);
  });

  it('should not update streak for multiple check-ins on the exact same day', () => {
    const result = checkAndUpdateStreak('2026-06-01T08:00:00Z', '2026-06-01T18:00:00Z', 5);
    expect(result.streak).toBe(5);
    expect(result.updated).toBe(false);
  });

  it('should handle leap year boundary correctly (Feb 28 to Feb 29)', () => {
    const result = checkAndUpdateStreak('2024-02-28T12:00:00Z', '2024-02-29T12:00:00Z', 10);
    expect(result.streak).toBe(11);
  });

  it('should handle midnight timezone boundaries without breaking streaks', () => {
    // Crosses day boundary in UTC but might be only 2 hours apart real-time
    const result = checkAndUpdateStreak('2026-06-01T23:00:00Z', '2026-06-02T01:00:00Z', 1);
    expect(result.streak).toBe(2);
  });
});