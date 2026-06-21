import { activateAdminUser, clearAdminLink, flagAdminLink, suspendAdminUser } from '../api/client';

export default function AdminPanel({ users, links, onUsersChange, onLinksChange }) {
  async function toggleUser(user) {
    const updated = user.is_active ? await suspendAdminUser(user.id) : await activateAdminUser(user.id);
    onUsersChange(users.map(item => (item.id === user.id ? updated : item)));
  }

  async function toggleLink(link) {
    const updated = link.is_flagged ? await clearAdminLink(link.id) : await flagAdminLink(link.id);
    onLinksChange(links.map(item => (item.id === link.id ? updated : item)));
  }

  return (
    <section className="panel-block admin-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h2 className="serif">Moderation.</h2>
        </div>
      </div>

      <div className="admin-columns">
        <div className="data-list">
          <strong>Users</strong>
          {users.map(user => (
            <article key={user.id} className="data-row compact-row">
              <div>
                <strong>{user.email}</strong>
                <p>{user.is_admin ? 'Admin' : 'Member'} · {user.is_verified ? 'Verified' : 'Unverified'}</p>
              </div>
              <button type="button" className="button compact secondary" onClick={() => toggleUser(user)}>
                {user.is_active ? 'Suspend' : 'Activate'}
              </button>
            </article>
          ))}
        </div>

        <div className="data-list">
          <strong>Links</strong>
          {links.map(link => (
            <article key={link.id} className="data-row compact-row">
              <div>
                <strong>{link.slug}</strong>
                <p>{link.url}</p>
              </div>
              <button type="button" className="button compact danger" onClick={() => toggleLink(link)}>
                {link.is_flagged ? 'Clear' : 'Flag'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
