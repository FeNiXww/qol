import { base44 } from '@/api/base44Client';

// Returns a Set of the ids that still exist as users in the database.
// Falls back to returning all IDs as existing if the backend function is unavailable.
export async function getExistingUserIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Set();
  try {
    const { data } = await base44.functions.invoke('checkUsersExist', { ids: unique });
    if (data?.existing_ids) return new Set(data.existing_ids);
  } catch {
    // Backend function unavailable — treat all IDs as existing
  }
  return new Set(unique);
}