const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../messages.js'), 'utf8');
const parse = runInNewContext(`${source}\nparseIncomingMessage`);

test('conserva dos puntos, Unicode, saltos de línea y etiquetas como texto', () => {
  const message = parse('María: tema: hola 👋\n<b>texto</b>');
  assert.equal(message.author, 'María');
  assert.equal(message.text, 'tema: hola 👋\n<b>texto</b>');
});

test('conserva avisos sin asumir un protocolo de presencia autenticado', () => {
  const message = parse('Bob left the chat');
  assert.equal(message.author, 'Servidor');
  assert.equal(message.text, 'Bob left the chat');
});
