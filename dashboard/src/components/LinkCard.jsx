import { useState } from 'react';
import { deleteLink } from '../api/client';

export default function LinkCard({ link, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this link? Redirects will stop working.')) return;
    setDeleting(true);
    try {
      await deleteLink(link.id);
      onDeleted?.(link.id);
    } catch {
      setDeleting(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(link.short_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const created = new Date(link.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="link-card">
      <div className="link-main">
        <div>
          <a href={link.short_url} target="_blank" rel="noreferrer" className="short-url">
            {link.short_url}
          </a>
          <p>{link.url}</p>
        </div>
        {link.title && <span className="link-title">{link.title}</span>}
      </div>

      <div className="link-meta">
        <span>{link.clicks || 0} clicks</span>
        <span>Created {created}</span>
        <span>{link.is_active ? 'Active' : 'Paused'}</span>
      </div>

      <div className="link-actions">
        <button type="button" className="button compact secondary" onClick={copyToClipboard}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="button compact danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting' : 'Delete'}
        </button>
      </div>
    </article>
  );
}
