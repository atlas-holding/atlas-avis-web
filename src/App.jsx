import { useEffect, useState } from 'react';

// atlas-avis-web -- Frontend web (Golden Path React)
// VITE_API_URL est injecte au build par DxP (service-ref "browser" vers atlas-avis-bff).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const SENT = {
  positif: { bg: '#e7f6ec', fg: '#127a3d', label: 'Positif' },
  neutre: { bg: '#f2f4f7', fg: '#475467', label: 'Neutre' },
  negatif: { bg: '#fde8e8', fg: '#b42318', label: 'Négatif' },
};

const C = { brand: '#5f249f', ink: '#1d1d1f', muted: '#667085', line: '#eaecf0', bg: '#f5f5f7' };
const s = {
  card: { background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  input: { width: '100%', boxSizing: 'border-box', padding: 8, marginBottom: 10, border: '1px solid #d0d5dd', borderRadius: 6, fontSize: 14, fontFamily: 'inherit' },
  button: { background: C.brand, color: '#fff', border: 0, borderRadius: 6, padding: '8px 14px', fontSize: 14, cursor: 'pointer' },
  ghost: { background: '#fff', color: C.brand, border: `1px solid ${C.brand}`, borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  chip: { background: '#f2f4f7', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginRight: 6 },
};

const Stars = ({ n }) => <span style={{ color: '#f5a623', letterSpacing: 1 }}>{'★'.repeat(n)}<span style={{ color: '#d0d5dd' }}>{'★'.repeat(5 - n)}</span></span>;

function Dot({ state }) {
  const color = state === 'up' ? '#12b76a' : state === 'memoire' ? '#f79009' : state ? '#f04438' : '#98a2b3';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 }} />;
}

function Kpi({ label, value }) {
  return (
    <div style={{ ...s.card, flex: 1, padding: 12 }}>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [produits, setProduits] = useState([]);
  const [selected, setSelected] = useState(1);
  const [avis, setAvis] = useState([]);
  const [form, setForm] = useState({ client: '', note: 5, texte: '' });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const call = async (path, options) => {
    const r = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  };

  const load = async (pid = selected) => {
    setError('');
    try {
      setStatus(await call('/api/status'));
      setProduits(await call('/api/produits'));
      setAvis(await call(`/api/avis?produit=${pid}`));
    } catch (e) {
      setError(`Backend injoignable (${e.message})`);
    }
  };

  useEffect(() => { document.body.style.margin = '0'; load(); }, []);

  const choose = (pid) => { setSelected(pid); load(pid); };

  const analyse = async (id) => {
    setBusy(id);
    try {
      await call(`/api/avis/${id}/analyse`, { method: 'POST' });
      await load();
    } catch (e) { setError(`Analyse IA : ${e.message}`); }
    setBusy(null);
  };

  const analyseAll = async () => {
    setBusy('all');
    try {
      for (const a of avis.filter(x => !x.analyse)) {
        await call(`/api/avis/${a.id}/analyse`, { method: 'POST' });
      }
      await load();
    } catch (e) { setError(`Analyse IA : ${e.message}`); }
    setBusy(null);
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.texte.trim()) return;
    setBusy('create');
    try {
      await call('/api/avis', { method: 'POST', body: JSON.stringify({ ...form, note: Number(form.note), produit_id: selected }) });
      setForm({ client: '', note: 5, texte: '' });
      await load();
    } catch (err) { setError(err.message); }
    setBusy(null);
  };

  const produit = produits.find(p => p.id === selected);
  const analyses = avis.filter(a => a.analyse);
  const positifs = analyses.filter(a => a.analyse.sentiment === 'positif').length;

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: C.bg, minHeight: '100vh', color: C.ink }}>
      <header style={{ background: C.brand, color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Atlas Argan · Avis clients</div>
          <div style={{ fontSize: 12, opacity: .8 }}>Analyse des avis par l'IA - déployé sur DxP</div>
        </div>
        <div style={{ fontSize: 12, textAlign: 'right', lineHeight: 1.6 }}>
          <div><Dot state={status ? 'up' : error ? 'down' : null} />atlas-avis-bff</div>
          {status && Object.entries(status.dependances).map(([k, v]) => <div key={k}><Dot state={v} />{k}{v === 'memoire' ? ' (mémoire)' : ''}</div>)}
        </div>
      </header>

      {error && <div style={{ background: '#fde8e8', color: '#b42318', padding: '10px 32px', fontSize: 14 }}>{error}</div>}

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        <aside>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Produits</div>
          {produits.map(p => (
            <div key={p.id} onClick={() => choose(p.id)} style={{ ...s.card, marginBottom: 8, cursor: 'pointer', border: `2px solid ${p.id === selected ? C.brand : 'transparent'}` }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
              <div style={{ fontSize: 12, color: C.muted, margin: '2px 0 4px' }}>{p.categorie} · {p.prix} MAD</div>
              <div style={{ fontSize: 13 }}><Stars n={Math.round(p.note_moyenne)} /> <span style={{ color: C.muted }}>{p.note_moyenne} ({p.nb_avis} avis)</span></div>
            </div>
          ))}
        </aside>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{produit ? produit.nom : ''}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.ghost} onClick={() => load()}>Actualiser</button>
              <button style={s.button} disabled={busy === 'all' || analyses.length === avis.length} onClick={analyseAll}>
                {busy === 'all' ? 'Analyse en cours...' : 'Analyser tous les avis'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Kpi label="Note moyenne" value={produit ? `${produit.note_moyenne} / 5` : '-'} />
            <Kpi label="Avis" value={avis.length} />
            <Kpi label="Analysés par l'IA" value={`${analyses.length} / ${avis.length}`} />
            <Kpi label="Sentiment positif" value={analyses.length ? `${Math.round(100 * positifs / analyses.length)} %` : '-'} />
          </div>

          {avis.map(a => {
            const sent = a.analyse && (SENT[a.analyse.sentiment] || SENT.neutre);
            return (
              <div key={a.id} style={{ ...s.card, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13 }}><Stars n={a.note} /> <span style={{ color: C.muted, marginLeft: 6 }}>{a.client || 'Client'} · {a.date}</span></div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>{a.texte}</div>
                  </div>
                  {!a.analyse && (
                    <button style={{ ...s.ghost, alignSelf: 'start' }} disabled={!!busy} onClick={() => analyse(a.id)}>
                      {busy === a.id ? 'Analyse IA...' : "Analyser avec l'IA"}
                    </button>
                  )}
                </div>
                {a.analyse && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
                    <span style={{ background: sent.bg, color: sent.fg, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 8 }}>{sent.label}</span>
                    {(a.analyse.themes || []).map(t => <span key={t} style={s.chip}>{t}</span>)}
                    <div style={{ marginTop: 8, padding: 10, background: '#f9f5ff', borderRadius: 6, color: '#344054' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.brand, textTransform: 'uppercase', marginBottom: 4 }}>Réponse proposée</div>
                      {a.analyse.reponse_suggeree}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <form style={{ ...s.card, marginTop: 20 }} onSubmit={create}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Ajouter un avis sur ce produit</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...s.input, flex: 2 }} placeholder="Client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
              <select style={{ ...s.input, flex: 1 }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </div>
            <textarea style={{ ...s.input, minHeight: 70 }} placeholder="Texte de l'avis" value={form.texte} onChange={e => setForm({ ...form, texte: e.target.value })} />
            <button style={s.button} disabled={busy === 'create'}>{busy === 'create' ? 'Envoi...' : "Publier l'avis"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
