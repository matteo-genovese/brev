import { createCheckoutSession } from '../api/client';

async function startCheckout() {
  const session = await createCheckoutSession();
  window.location.href = session.url;
}

export default function BillingPanel({ billing, onRefresh }) {
  return (
    <section className="panel-block">
      <div className="panel-head split">
        <div>
          <p className="eyebrow">Cloud</p>
          <h2 className="serif">Billing.</h2>
        </div>
        <span className={billing?.active ? 'status good' : 'status'}>
          {billing?.active ? 'Active' : 'Free'}
        </span>
      </div>
      <p className="muted">
        Plan: {billing?.plan || 'free'} · Custom domains included before billing: {billing?.included_custom_domains ?? 0}
      </p>
      {billing?.current_period_end && (
        <p className="muted">Renews {new Date(billing.current_period_end).toLocaleDateString()}</p>
      )}
      <div className="row-actions left">
        <button type="button" className="button primary" onClick={startCheckout}>
          Upgrade
        </button>
        <button type="button" className="button secondary" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </section>
  );
}
