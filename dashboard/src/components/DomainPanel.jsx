import { useState } from 'react';
import { createDomain, deleteDomain, verifyDomain } from '../api/client';

export default function DomainPanel({ domains, onChange }) {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <article key={item.id} className="data-row">
            <div>
              <strong>{item.domain}</strong>
              <p>
                TXT {item.verification_dns_name} = {item.verification_token}
              </p>
              <p>CNAME target: {item.cname_target}</p>
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
