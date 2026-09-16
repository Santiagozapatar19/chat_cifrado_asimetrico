// Sin dependencias: node --test frontend/test/connection.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../connection.js'), 'utf8');

function setup(protocol = 'http:') {
  const sockets = [];
  const states = [];
  const received = [];
  const timers = new Map();
  let timerId = 0;
  class FakeSocket extends EventTarget {
    static CLOSING = 2;
    static OPEN = 1;
    constructor(url) { super(); this.url = url; this.readyState = 0; this.sent = []; sockets.push(this); }
    send(text) { this.sent.push(text); }
    close() { this.readyState = 3; }
    emit(type, code = 1006) {
      if (type === 'open') this.readyState = 1;
      const event = new Event(type);
      event.code = code;
      this.dispatchEvent(event);
    }
    receive(data) { const event = new Event('message'); event.data = data; this.dispatchEvent(event); }
  }
  const Connection = runInNewContext(`${source}\nChatConnection`, {
    WebSocket: FakeSocket,
    location: { protocol },
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  const connection = new Connection((state, message) => states.push({ state, message }), 10000, (text) => received.push(text));
  return { connection, sockets, states, timers, received };
}

test('conecta una sola vez y limpia el temporizador al abrir', () => {
  const { connection, sockets, states, timers } = setup();
  connection.connect('ws://localhost:8000/ws/Alice');
  connection.connect('ws://localhost:8000/ws/Bob');
  assert.equal(sockets.length, 1);
  assert.equal(states.at(-1).state, 'connecting');
  sockets[0].emit('open');
  assert.equal(states.at(-1).state, 'connected');
  assert.equal(timers.size, 0);
});

test('cancelar permite reintentar e ignora eventos de la conexión anterior', () => {
  const { connection, sockets, states, timers } = setup();
  connection.connect('ws://localhost:8000/ws/Alice');
  connection.disconnect();
  assert.equal(states.at(-1).state, 'disconnected');
  assert.equal(timers.size, 0);
  connection.connect('ws://localhost:8000/ws/Bob');
  sockets[0].emit('error');
  sockets[0].emit('close');
  sockets[0].emit('open');
  assert.equal(states.at(-1).state, 'connecting');
  sockets[1].emit('open');
  assert.equal(states.at(-1).state, 'connected');
});

test('el timeout libera la conexión y no admite un open tardío', () => {
  const { connection, sockets, states, timers } = setup();
  connection.connect('ws://localhost:8000/ws/Alice');
  [...timers.values()][0]();
  assert.equal(states.at(-1).state, 'error');
  assert.equal(connection.socket, null);
  assert.equal(sockets[0].readyState, 3);
  sockets[0].emit('open');
  assert.equal(states.at(-1).state, 'error');
});

test('un error TLS conserva su diagnóstico aunque llegue close después', () => {
  const { connection, sockets, states } = setup();
  connection.connect('wss://localhost:8443/ws/Alice');
  sockets[0].emit('error');
  sockets[0].emit('close');
  assert.equal(states.length, 2);
  assert.match(states.at(-1).message, /certificado/);
});

test('el cierre remoto libera el socket y permite volver a conectar', () => {
  const { connection, sockets, states } = setup();
  connection.connect('ws://localhost:8000/ws/Alice');
  sockets[0].emit('open');
  sockets[0].emit('close', 1001);
  assert.equal(connection.socket, null);
  assert.match(states.at(-1).message, /1001/);
  connection.connect('ws://localhost:8000/ws/Alice');
  assert.equal(sockets.length, 2);
});

test('envía solo con socket abierto y devuelve false ante fallo de envío', () => {
  const { connection, sockets } = setup();
  assert.equal(connection.send('hola'), false);
  connection.connect('ws://localhost:8000/ws/Alice');
  assert.equal(connection.send('hola'), false);
  sockets[0].emit('open');
  assert.equal(connection.send('hola 👋\nsegunda línea'), true);
  assert.deepEqual(sockets[0].sent, ['hola 👋\nsegunda línea']);
  sockets[0].send = () => { throw new Error('Socket cerrado'); };
  assert.equal(connection.send('borrador'), false);
});

test('no entrega mensajes de sockets anteriores ni contenido binario', () => {
  const { connection, sockets, received } = setup();
  connection.connect('ws://localhost:8000/ws/Alice');
  sockets[0].emit('open');
  sockets[0].receive('Bob: hola');
  sockets[0].receive(new Uint8Array([1]));
  connection.disconnect();
  sockets[0].receive('Bob: antiguo');
  assert.deepEqual(received, ['Bob: hola']);
});

test('informa sobre contenido mixto antes de intentar WS desde HTTPS', () => {
  const { connection, sockets, states } = setup('https:');
  connection.connect('ws://localhost:8000/ws/Alice');
  assert.equal(sockets.length, 0);
  assert.equal(states.at(-1).state, 'error');
  assert.match(states.at(-1).message, /HTTPS/);
});
