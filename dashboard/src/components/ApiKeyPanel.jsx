import { useState } from 'react';
import { createApiKey, revokeApiKey } from '../api/client';

export default function ApiKeyPanel({ apiKeys, onChange }) {
  const [name, setName] = useState('CLI');
  const [createdToken, setCreatedToken] = useState('');
  const [error, setError] = useState('');

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setCreatedToken('');
    try {
      const created = await createApiKey(name);
      setCreatedToken(created.token);
      onChange([created, ...apiKeys]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRevoke(item) {
    if (!window.confirm(`Revoke ${item.name}?`)) return;
    await revokeApiKey(item.id);
    onChange(apiKeys.map(key => (key.id === item.id ? { ...key, is_active: false } : key)));
  }

  return (
    <section className="panel-block">
      <div className="panel-head">
        <div>
          <p className="eyebrow">CLI</p>
          <h2 className="serif">API keys.</h2>
        </div>
      </div>

      <form className="inline-form" onSubmit={handleCreate}>
        <label htmlFor="api-key-name" className="sr-only">API key name</label>
        <input
          id="api-key-name"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          maxLength={80}
          required
        />
        <button type="submit" className="button primary">Create</button>
      </form>

      {error && <div className="alert">{error}</div>}
      {createdToken && (
        <div className="success-box">
          <strong>Copy this API key now</strong>
          <span>{createdToken}</span>
        </div>
      )}

      <div className="data-list">
        {apiKeys.map(item => (
          <article key={item.id} className="data-row">
            <div>
              <strong>{item.name}</strong>
              <p>{item.prefix}... created {new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <div className="row-actions">
              <span className={item.is_active ? 'status good' : 'status'}>{item.is_active ? 'Active' : 'Revoked'}</span>
              {item.is_active && (
                <button type="button" className="button compact danger" onClick={() => handleRevoke(item)}>
                  Revoke
                </button>
              )}
            </div>
          </article>
        ))}
        {apiKeys.length === 0 && <p className="muted">No API keys yet.</p>}
      </div>
    </section>
  );
}
