import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { wasLocalMatchRecent } from '@/lib/discovery';
import MatchModal from '@/components/qol/MatchModal';

// Shows the "You're connected!" celebration when a match is created by the
// OTHER person (e.g. they accepted your connection request). Locally-created
// matches are skipped — the swiper's own flow shows the modal already.
export default function ConnectedNotifier() {
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

  useEffect(() => {
    if (!me) return;
    const unsub = base44.entities.Match.subscribe(async (event) => {
      if (event.type !== 'create') return;
      const match = event.data;
      if (match.user_a_id !== me.id && match.user_b_id !== me.id) return;
      if (wasLocalMatchRecent()) return;
      const otherId = match.user_a_id === me.id ? match.user_b_id : match.user_a_id;
      const [otherProfiles, myProfiles] = await Promise.all([
        base44.entities.Profile.filter({ user_id: otherId }),
        base44.entities.Profile.filter({ user_id: me.id }),
      ]);
      setData({ match, otherProfile: otherProfiles[0] || null, myProfile: myProfiles[0] || null });
    });
    return unsub;
  }, [me?.id]);

  if (!data || !data.myProfile) return null;
  return (
    <MatchModal
      match={{ ...data.match, otherProfile: data.otherProfile }}
      myProfile={data.myProfile}
      onClose={() => setData(null)}
    />
  );
}