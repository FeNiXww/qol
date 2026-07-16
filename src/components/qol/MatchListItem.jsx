import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '@/lib/theme';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ChevronRight } from 'lucide-react';

export default function MatchListItem({ match }) {
  const { otherProfile, last_message_at, id } = match;
  const name = otherProfile?.display_name || 'Unknown';
  const avatar = otherProfile?.avatar_url;
  const nationality = otherProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const timeAgo = last_message_at ? formatDistanceToNow(new Date(last_message_at), { addSuffix: true }) : '';

  return (
    <Link
      to={`/chat/${id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: theme.colors.teal }}
          >
            {name[0]?.toUpperCase()}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-base">{nationality}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-sm text-gray-400 truncate flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {timeAgo || 'New match!'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
    </Link>
  );
}