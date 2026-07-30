import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Given a list of user ids, returns which of them still exist in the User table.
// Used to hide profiles/matches of users that were deleted from the database.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ existing_ids: [] });
    }

    const uniqueIds = [...new Set(ids)]
      .filter((id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id))
      .slice(0, 200);
    if (uniqueIds.length === 0) return Response.json({ existing_ids: [] });
    const users = await base44.asServiceRole.entities.User.filter({ id: { $in: uniqueIds } }, undefined, 200);
    return Response.json({ existing_ids: users.map((u) => u.id) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});