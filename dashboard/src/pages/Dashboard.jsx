import { useEffect, useMemo, useState } from 'react';
import { getApiKeys, getDomains, getLinks, me } from '../api/client';
import ApiKeyPanel from '../components/ApiKeyPanel';
import CreateLinkModal from '../components/CreateLinkModal';
import DomainPanel from '../components/DomainPanel';
import Layout from '../components/Layout';
import LinkCard from '../components/LinkCard';

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('');
  const [domains, setDomains] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      const [userData, linksData, domainsData, apiKeysData] = await Promise.allSettled([
        me(),
        getLinks(),
        getDomains(),
        getApiKeys(),
      ]);
      if (cancelled) return;
      if (userData.status === 'fulfilled') setUser(userData.value);
      if (linksData.status === 'fulfilled') setLinks(linksData.value.items || []);
      if (domainsData.status === 'fulfilled') setDomains(domainsData.value.items || []);
      if (apiKeysData.status === 'fulfilled') setApiKeys(apiKeysData.value.items || []);
      setLoading(false);
    }
    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return links;
    return links.filter(link =>
      [link.short_url, link.url, link.slug, link.title]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query)),
    );
  }, [filter, links]);

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  function handleDeleted(id) {
    setLinks(current => current.filter(link => link.id !== id));
  }

  function handleCreated(link) {
    setLinks(current => [link, ...current]);
  }

  return (
    <Layout>
      <header className="page-head">
        <div>
          <p className="eyebrow">Links</p>
          <h1 className="serif">Control room.</h1>
          <p className="muted">
            {links.length} links, {totalClicks} tracked clicks
            {user?.created_at ? `, joined ${new Date(user.created_at).toLocaleDateString()}` : ''}
          </p>
        </div>
        <button type="button" className="button primary" onClick={() => setShowCreate(true)}>
          New link
        </button>
      </header>

      <section className="metrics" aria-label="Link metrics">
        <article>
          <span>Total links</span>
          <strong>{links.length}</strong>
        </article>
        <article>
          <span>Total clicks</span>
          <strong>{totalClicks}</strong>
        </article>
        <article>
          <span>Active links</span>
          <strong>{links.filter(link => link.is_active).length}</strong>
        </article>
      </section>

      <section className="toolbar" aria-label="Link actions">
        <label htmlFor="search-links" className="sr-only">Search links</label>
        <input
          id="search-links"
          type="search"
          value={filter}
          onChange={event => setFilter(event.target.value)}
          placeholder="Search by slug, destination, or title"
        />
      </section>

      {loading ? (
        <div className="empty-state">Loading links</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2 className="serif">{filter ? 'No matches.' : 'No links yet.'}</h2>
          <p>{filter ? 'Try another search term.' : 'Create the first short link for this workspace.'}</p>
          {!filter && (
            <button type="button" className="button secondary" onClick={() => setShowCreate(true)}>
              Create link
            </button>
          )}
        </div>
      ) : (
        <div className="link-list">
          {filtered.map(link => (
            <LinkCard key={link.id} link={link} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      <div className="settings-grid">
        <DomainPanel domains={domains} onChange={setDomains} />
        <ApiKeyPanel apiKeys={apiKeys} onChange={setApiKeys} />
      </div>

      <CreateLinkModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </Layout>
  );
}
