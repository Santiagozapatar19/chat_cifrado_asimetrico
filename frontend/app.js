// Primera entrega: configuración local. La conexión WebSocket se agrega después.
const form = document.querySelector('#connection-form');
const usernameInput = document.querySelector('#username');
const serverInput = document.querySelector('#server');
const endpointOutput = document.querySelector('#endpoint');
const statusOutput = document.querySelector('#config-status');

function readConfiguration() {
  const transport = new FormData(form).get('transport');
  const username = usernameInput.value.trim();
  const host = serverInput.value.trim();
  const port = transport === 'wss' ? '8443' : '8000';
  return { username, host, transport, endpoint: `${transport}://${host}:${port}/ws/${encodeURIComponent(username)}` };
}

function validateConfiguration() {
  const { username, host } = readConfiguration();
  usernameInput.setCustomValidity(username && !/[\/:\u0000-\u001f]/.test(username)
    ? '' : 'Escribe un nombre sin barras, dos puntos ni caracteres de control.');
  // Hosts DNS/IPv4 o IPv6 entre corchetes. El puerto lo determina el transporte.
  const validHost = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?|\[[a-fA-F0-9:]+\])$/.test(host);
  let validUrl = false;
  try { validUrl = Boolean(new URL(`http://${host}`).hostname); } catch { /* Entrada incompleta. */ }
  serverInput.setCustomValidity(validHost && validUrl ? '' : 'Escribe un host o IP válido, sin protocolo, puerto ni ruta.');
}

function updatePreview() {
  validateConfiguration();
  const config = readConfiguration();
  endpointOutput.textContent = serverInput.validity.valid
    ? `${config.transport}://${config.host}:${config.transport === 'wss' ? '8443' : '8000'}/ws/${encodeURIComponent(config.username || 'tu-nombre')}`
    : 'Revisa la dirección del servidor';
  statusOutput.dataset.state = '';
  statusOutput.textContent = 'La conexión al chat estará disponible en la siguiente entrega.';
}

form.addEventListener('input', updatePreview);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateConfiguration();
  if (!form.reportValidity()) return;
  statusOutput.dataset.state = 'success';
  statusOutput.textContent = `Configuración lista para ${readConfiguration().username}. Aún no se ha abierto una conexión.`;
});

updatePreview();
