import { base44 } from '@/api/base44Client';

// Returns a Set of the ids that still exist as users in the database.
export async function getExistingUserIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Set();
  const { data } = await base44.functions.invoke('checkUsersExist', { ids: unique });
  return new Set(data?.existing_ids || []);
}