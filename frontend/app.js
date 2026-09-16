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
let connectionState = 'disconnected';
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message');
const sendButton = document.querySelector('.send-button');
const messageStatus = document.querySelector('#message-status');
const messageCount = document.querySelector('#message-count');
const messages = new MessageList(document.querySelector('#message-list'), document.querySelector('.empty-state'));

function updateComposer() {
  messageInput.disabled = connectionState !== 'connected';
  sendButton.disabled = messageInput.disabled || !messageInput.value.trim() || messageInput.value.length > 2000;
  messageCount.textContent = `${messageInput.value.length}/2000 caracteres`;
}

function renderConnectionState(state, message) {
  connectionState = state;
  updateComposer();
  messageStatus.textContent = state === 'connected'
    ? 'Enter para enviar · Shift + Enter para una nueva línea.'
    : 'Conecta tu instancia para escribir un mensaje.';
  const busy = state === 'connecting' || state === 'connected';
  configInputs.forEach((input) => {
    input.disabled = input.name === 'transport' ? state === 'connecting' : busy;
  });
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
  statusOutput.setAttribute('role', state === 'error' ? 'alert' : 'status');
  statusOutput.textContent = state === 'connected'
    ? `Conectado como ${activeConfig.username}. ${activeConfig.transport === 'wss' ? 'Transporte cifrado con TLS.' : 'Transporte sin cifrar.'}` : message;
  emptyTitle.textContent = state === 'connected' ? 'Tu instancia está conectada.' : 'Todo empieza con un hola.';
  emptyDescription.textContent = state === 'connected'
    ? 'Escribe un mensaje. Para recibirlo, abre otra instancia en el mismo servidor y transporte.'
    : 'Conecta tu instancia al servidor para entrar a la sala del laboratorio.';
}

const connection = new ChatConnection(renderConnectionState, 10000, (raw) => {
  messages.append({ ...parseIncomingMessage(raw), transport: activeConfig.transport });
});

function readConfiguration() {
  const transport = form.querySelector('input[name="transport"]:checked').value;
  const username = usernameInput.value.trim();
  const host = serverInput.value.trim();
  const port = transport === 'wss' ? '8443' : '8000';
  return { username, host, transport, endpoint: `${transport}://${host}:${port}/ws/${encodeURIComponent(username)}` };
}

function validateConfiguration() {
  const { username, host } = readConfiguration();
  usernameInput.setCustomValidity(username && !/[\/:\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(username)
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
  const tlsLink = document.querySelector('#tls-server-link');
  tlsLink.hidden = !serverInput.validity.valid;
  if (serverInput.validity.valid) tlsLink.href = `https://${config.host}:8443/`;
  document.querySelector('#transport-help').textContent = config.transport === 'wss'
    ? 'TLS cifra el transporte. Todos los participantes deben usar WSS y un certificado confiable.'
    : 'Texto plano: el contenido puede inspeccionarse en Wireshark. Todos los participantes deben usar WS.';
  if (connectionState === 'connected' || connectionState === 'connecting') return;
  statusOutput.dataset.state = '';
  statusOutput.setAttribute('role', 'status');
  statusOutput.textContent = 'Configura tu instancia para conectar al servidor.';
}

form.addEventListener('input', updatePreview);
form.addEventListener('change', (event) => {
  if (event.target.name !== 'transport' || connectionState !== 'connected') return;
  const nextConfig = readConfiguration();
  // Dos procesos de Uvicorn implican dos salas. Conservar historial y borrador.
  connection.disconnect();
  activeConfig = nextConfig;
  connection.connect(activeConfig.endpoint);
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateConfiguration();
  if (!form.reportValidity()) return;
  if (connection.socket) return;
  activeConfig = readConfiguration();
  connection.connect(activeConfig.endpoint);
});

disconnectButton.addEventListener('click', () => {
  connection.disconnect();
  connectButton.focus();
});
window.addEventListener('pagehide', () => connection.disconnect());

messageInput.addEventListener('input', () => {
  updateComposer();
  messageStatus.textContent = 'Enter para enviar · Shift + Enter para una nueva línea.';
});
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});
messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value;
  if (!text.trim()) return;
  if (text.length > 2000) {
    messageStatus.textContent = 'El mensaje supera los 2000 caracteres. Acórtalo para enviarlo.';
    return;
  }
  if (!connection.send(text)) {
    messageStatus.textContent = 'No se pudo enviar. Tu borrador se conserva; revisa la conexión.';
    return;
  }
  // El backend no devuelve eco al emisor: renderizamos su mensaje localmente.
  messages.append({ author: activeConfig.username, text, own: true, transport: activeConfig.transport });
  messageInput.value = '';
  updateComposer();
  messageInput.focus();
  messageStatus.textContent = 'Enviado al socket. El servidor no confirma la entrega al destinatario.';
});

updatePreview();
