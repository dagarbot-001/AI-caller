import { useAgent } from './hooks/useAgent';

const CUSTOMER_NAME = 'Rahul';
const START_LINE = 'Namaste Rahul ji, main Aisha bol rahi hoon. Kya main aapse 2 minute baat kar sakti hoon?';

function App() {
  const { mode, state, statusLabel, transcript, error, start, stop, switchMode } = useAgent({
    customerName: CUSTOMER_NAME,
    startLine: START_LINE,
  });

  return (
    <main className="app">
      <h1>Aisha - Real-time Voice AI Agent</h1>

      <section className="controls">
        <button onClick={start} disabled={state === 'speaking' || state === 'thinking' || state === 'listening'}>
          Start Voice Agent
        </button>

        <button onClick={stop}>Stop</button>

        <button onClick={switchMode}>Switch Mode ({mode})</button>
      </section>

      <p className="status">Status: {statusLabel}</p>
      {error && <p className="error">Error: {error}</p>}

      <section className="transcript">
        <h2>Live Transcript</h2>
        {transcript.length === 0 ? (
          <p>No conversation yet.</p>
        ) : (
          <ul>
            {transcript.map((item, idx) => (
              <li key={`${idx}-${item.speaker}`}>
                <strong>{item.speaker === 'aisha' ? 'Aisha' : 'User'}:</strong> {item.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
