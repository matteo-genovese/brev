import { useState } from 'react';
import { createDomain, deleteDomain, verifyDomain } from '../api/client';

export default function DomainPanel({ domains, onChange }) {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDomainId, setOpenDomainId] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await createDomain(domain);
      onChange([created, ...domains]);
      setDomain('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(item) {
    setError('');
    try {
      const verified = await verifyDomain(item.id);
      onChange(domains.map(domainItem => (domainItem.id === item.id ? verified : domainItem)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove ${item.domain}?`)) return;
    await deleteDomain(item.id);
    onChange(domains.filter(domainItem => domainItem.id !== item.id));
  }

  return (
    <section className="panel-block">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Domains</p>
          <h2 className="serif">Custom domains.</h2>
        </div>
      </div>

      <form className="inline-form" onSubmit={handleCreate}>
        <label htmlFor="custom-domain" className="sr-only">Custom domain</label>
        <input
          id="custom-domain"
          type="text"
          value={domain}
          onChange={event => setDomain(event.target.value)}
          placeholder="go.example.com"
          required
        />
        <button type="submit" className="button primary" disabled={loading}>
          Add
        </button>
      </form>

      {error && <div className="alert">{error}</div>}

      <div className="data-list">
        {domains.map(item => (
          <article key={item.id} className="data-row domain-row">
            <div className="domain-content">
              <button
                type="button"
                className="domain-name"
                aria-expanded={openDomainId === item.id}
                onClick={() => setOpenDomainId(current => (current === item.id ? null : item.id))}
              >
                {item.domain}
              </button>
              <p>Click the domain to view the DNS records to create.</p>
              {openDomainId === item.id && (
                <div className="dns-instructions">
                  <p className="dns-intro">In your DNS provider, create these records for {item.domain}.</p>
                  <dl>
                    <div>
                      <dt>Record type</dt>
                      <dd>TXT</dd>
                    </div>
                    <div>
                      <dt>Name / Host</dt>
                      <dd>{item.verification_dns_name}</dd>
                    </div>
                    <div>
                      <dt>Value</dt>
                      <dd>{item.verification_token}</dd>
                    </div>
                    <div>
                      <dt>Record type</dt>
                      <dd>CNAME</dd>
                    </div>
                    <div>
                      <dt>Name / Host</dt>
                      <dd>{item.domain}</dd>
                    </div>
                    <div>
                      <dt>Target / Points to</dt>
                      <dd>{item.cname_target}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
            <div className="row-actions">
              <span className={item.is_verified ? 'status good' : 'status'}>{item.is_verified ? 'Verified' : 'Pending'}</span>
              {!item.is_verified && (
                <button type="button" className="button compact secondary" onClick={() => handleVerify(item)}>
                  Verify
                </button>
              )}
              <button type="button" className="button compact danger" onClick={() => handleDelete(item)}>
                Remove
              </button>
            </div>
          </article>
        ))}
        {domains.length === 0 && <p className="muted">No custom domains yet.</p>}
      </div>
    </section>
  );
}
