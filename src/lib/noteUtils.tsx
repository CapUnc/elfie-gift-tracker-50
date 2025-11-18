import React from 'react';
import { ExternalLink } from 'lucide-react';

export const renderNoteContent = (
  content: string,
  linkUrl?: string | null,
  linkLabel?: string | null
): React.ReactNode => {
  if (linkUrl) {
    const label = linkLabel || linkUrl;
    return (
      <span>
        {content}{' '}
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
          <ExternalLink className="h-3 w-3" />
        </a>
      </span>
    );
  }
  
  return content;
};
