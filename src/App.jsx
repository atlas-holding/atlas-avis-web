import { useState } from 'react';

function App() {
  const backendUrl = import.meta.env.VITE_API_URL || '';
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  // S79 (ADR S0-083, service-ref Phase B) -- ping minimal du backend
  // reference, uniquement pour rendre le mecanisme verifiable depuis le
  // navigateur (test discriminant) : sans cet appel, aucun moyen de
  // confirmer depuis l'UI que VITE_API_URL a bien ete embarque au build.
  // Ne bloque jamais le rendu -- best-effort, erreur affichee telle quelle.
  const checkBackend = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const res = await fetch(backendUrl);
      setStatus(`${res.status} ${res.statusText}`);
    } catch (e) {
      setStatus(`error: ${e.message}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>atlas-avis-web</h1>
      <p></p>
      <p style={{ color: '#666' }}>Déployé sur DxP</p>

      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: 6, maxWidth: 480 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>
          Backend reference (service-ref)
        </div>
        {backendUrl ? (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: 13, marginBottom: 10, wordBreak: 'break-all' }}>{backendUrl}</div>
            <button onClick={checkBackend} disabled={checking}>
              {checking ? 'Checking...' : 'Check backend'}
            </button>
            {status && <div style={{ marginTop: 8, fontSize: 13 }}>{status}</div>}
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic' }}>
            Aucun backend reference (VITE_API_URL vide)
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
