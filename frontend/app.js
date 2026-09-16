// Configuración y presentación del estado; el transporte vive en connection.js.
const form = document.querySelector('#connection-form');
const usernameInput = document.querySelector('#username');
const serverInput = document.querySelector('#server');
const endpointOutput = document.querySelector('#endpoint');
const statusOutput = document.querySelector('#config-status');
const connectButton = document.querySelector('#connect-button');
const disconnectButton = document.querySelector('#disconnect-button');
const badge = document.querySelector('#connection-badge');
const connectionLabel = document.querySelector('#connection-label');
const emptyTitle = document.querySelector('.empty-state h3');
const emptyDescription = document.querySelector('.empty-state p');
const configInputs = form.querySelectorAll('input');
let activeConfig = null;

function renderConnectionState(state, message) {
  const busy = state === 'connecting' || state === 'connected';
  configInputs.forEach((input) => { input.disabled = busy; });
  connectButton.disabled = busy;
  connectButton.textContent = state === 'connecting' ? 'Conectando…'
    : state === 'connected' ? 'Conexión activa' : 'Conectar al servidor →';
  disconnectButton.hidden = !busy;
  disconnectButton.textContent = state === 'connecting' ? 'Cancelar conexión' : 'Desconectar';
  form.setAttribute('aria-busy', String(state === 'connecting'));
  badge.dataset.state = state;
  connectionLabel.textContent = {
    disconnected: 'Sin conexión', connecting: 'Conectando…',
    connected: activeConfig?.transport === 'wss' ? 'Conectado · TLS' : 'Conectado · WS',
    error: 'Error de conexión',
  }[state];
  statusOutput.dataset.state = state === 'connected' ? 'success' : state;
  statusOutput.textContent = state === 'connected'
    ? `Conectado como ${activeConfig.username}. ${activeConfig.transport === 'wss' ? 'Transporte cifrado con TLS.' : 'Transporte sin cifrar.'}` : message;
  emptyTitle.textContent = state === 'connected' ? 'Tu instancia está conectada.' : 'Todo empieza con un hola.';
  emptyDescription.textContent = state === 'connected'
    ? 'La conexión está lista. La conversación se habilitará en la siguiente entrega.'
    : 'Conecta tu instancia al servidor para entrar a la sala del laboratorio.';
}

const connection = new ChatConnection(renderConnectionState);

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
  statusOutput.textContent = 'Configura tu instancia para conectar al servidor.';
}

form.addEventListener('input', updatePreview);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateConfiguration();
  if (!form.reportValidity()) return;
  if (connection.socket) return;
  activeConfig = readConfiguration();
  connection.connect(activeConfig.endpoint);
});

disconnectButton.addEventListener('click', () => connection.disconnect());
window.addEventListener('pagehide', () => connection.disconnect());

updatePreview();
