/**
 * Browser Push Notification helper for game invitations.
 * Uses the standard Notifications API — no external service required.
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function showGameInviteNotification({ inviterName, gameName, onClick }) {
  if (!canNotify()) return;
  const notification = new Notification(`🎮 Game invitation!`, {
    body: `${inviterName} invited you to play ${gameName}`,
    icon: 'https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/a3fa26d38_Untitleddesign.png',
    badge: 'https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/a3fa26d38_Untitleddesign.png',
    tag: 'game-invite',
    requireInteraction: true,
  });
  if (onClick) notification.onclick = () => { onClick(); notification.close(); };
}