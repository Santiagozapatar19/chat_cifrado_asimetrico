// Requiere Node >= 22 y el backend activo. No modifica el backend.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../connection.js'), 'utf8');
const Connection = runInNewContext(`${source}\nChatConnection`, { WebSocket, setTimeout, clearTimeout });
const base = process.env.CHAT_TEST_URL || 'ws://127.0.0.1:8000';
const suffix = Date.now().toString(36);

async function waitFor(predicate, description) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Tiempo agotado: ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function client(name) {
  const state = { current: '', received: [] };
  const connection = new Connection((value) => { state.current = value; }, 3000,
    (message) => state.received.push(message));
  const endpoint = `${base}/ws/${encodeURIComponent(name)}`;
  connection.connect(endpoint);
  return { name, state, connection, endpoint };
}

(async () => {
  const alice = client(`Prueba_A_${suffix}`);
  const bob = client(`Prueba_B_${suffix}`);
  try {
    await waitFor(() => alice.state.current === 'connected' && bob.state.current === 'connected', 'conexiones');
    const text = 'LAB_CHAT_2026: hola 👋\n<b>Texto de prueba</b>';
    assert.equal(alice.connection.send(text), true);
    await waitFor(() => bob.state.received.includes(`${alice.name}: ${text}`), 'recepción exacta');
    assert.equal(bob.connection.send('Respuesta: recibida'), true);
    await waitFor(() => alice.state.received.includes(`${bob.name}: Respuesta: recibida`), 'respuesta');
    assert.equal(alice.state.received.includes(`${alice.name}: ${text}`), false, 'El backend no devuelve eco');
    alice.connection.disconnect();
    await waitFor(() => bob.state.received.includes(`${alice.name} left the chat`), 'aviso de salida');
    assert.equal(alice.connection.send('No debe salir'), false);
    alice.connection.connect(alice.endpoint);
    await waitFor(() => alice.state.current === 'connected', 'reconexión');
    alice.connection.send('LAB_CHAT_RECONNECTED');
    await waitFor(() => bob.state.received.includes(`${alice.name}: LAB_CHAT_RECONNECTED`), 'envío tras reconectar');
    console.log(`PASS ${base}: dos clientes, texto exacto, respuesta, sin eco, salida y reconexión`);
  } finally {
    alice.connection.disconnect();
    bob.connection.disconnect();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
