import { base44 } from '@/api/base44Client';

// Free-tier limits (match the Premium page marketing copy).
export const DAILY_SWIPE_LIMIT = 20;
export const DICT_WORD_LIMIT = 50;

export async function getSubscription(userId) {
  if (!userId) return null;
  try {
    const subs = await base44.entities.Subscription.filter({ user_id: userId });
    return subs[0] || null;
  } catch {
    return null;
  }
}

export function isPremiumActive(sub) {
  if (!sub) return false;
  if (sub.plan !== 'premium' || sub.status !== 'active') return false;
  if (sub.expires_at && new Date(sub.expires_at).getTime() < Date.now()) return false;
  return true;
}

// A new day resets the daily swipe counter.
function isNewDay(sub) {
  if (!sub || !sub.swipes_reset_at) return true;
  const reset = new Date(sub.swipes_reset_at);
  const now = new Date();
  return (
    reset.getDate() !== now.getDate() ||
    reset.getMonth() !== now.getMonth() ||
    reset.getFullYear() !== now.getFullYear()
  );
}

export function dailySwipesRemaining(sub) {
  if (isPremiumActive(sub)) return Infinity;
  const used = isNewDay(sub) ? 0 : sub?.swipes_used_today || 0;
  return Math.max(0, DAILY_SWIPE_LIMIT - used);
}

// Persist the swipe count server-side (best-effort, fire-and-forget). Creates a
// free subscription record on first use so the counter has somewhere to live.
export async function bumpSwipeCount(userId, sub) {
  if (!userId) return;
  try {
    const record = sub && sub.id ? sub : await getSubscription(userId);
    const reset = isNewDay(record);
    const used = reset ? 0 : record?.swipes_used_today || 0;
    if (record) {
      await base44.entities.Subscription.update(record.id, {
        swipes_used_today: used + 1,
        swipes_reset_at: new Date().toISOString(),
      });
    } else {
      await base44.entities.Subscription.create({
        user_id: userId,
        plan: 'free',
        status: 'active',
        swipes_used_today: 1,
        swipes_reset_at: new Date().toISOString(),
      });
    }
  } catch {}
}