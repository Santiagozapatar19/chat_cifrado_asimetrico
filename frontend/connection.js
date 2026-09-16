// Una sola conexión activa. Los eventos de conexiones anteriores se ignoran.
class ChatConnection {
  constructor(onStateChange, timeoutMs = 10000, onMessage = () => {}) {
    this.onStateChange = onStateChange;
    this.timeoutMs = timeoutMs;
    this.socket = null;
    this.timer = null;
    this.onMessage = onMessage;
  }

  connect(endpoint) {
    if (this.socket) return;
    this.onStateChange('connecting', 'Abriendo conexión con el servidor…');
    let socket;
    try {
      socket = new WebSocket(endpoint);
    } catch {
      this.onStateChange('error', 'El navegador no pudo abrir esta conexión. Revisa la dirección y el protocolo.');
      return;
    }
    this.socket = socket;
    socket.addEventListener('message', (event) => {
      if (this.socket === socket && typeof event.data === 'string') this.onMessage(event.data);
    });

    const fail = (message) => {
      if (this.socket !== socket) return;
      this.release();
      this.onStateChange('error', message);
    };
    this.timer = setTimeout(() => {
      fail('El servidor no respondió en 10 segundos. Revisa que esté encendido y vuelve a intentar.');
    }, this.timeoutMs);

    socket.addEventListener('open', () => {
      if (this.socket !== socket) return;
      clearTimeout(this.timer);
      this.timer = null;
      this.onStateChange('connected', 'Conexión establecida.');
    });
    socket.addEventListener('error', () => {
      fail(endpoint.startsWith('wss:')
        ? 'No se pudo conectar por TLS. Revisa el servidor en 8443 y que el certificado sea confiable para el navegador.'
        : 'No se pudo conectar. Revisa el servidor en 8000, la dirección y el acceso de red.');
    });
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return;
      fail(`El servidor cerró la conexión (código ${event.code}). Puedes volver a conectar.`);
    });
  }

  send(text) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    try {
      this.socket.send(text);
      return true;
    } catch {
      return false;
    }
  }

  release() {
    const socket = this.socket;
    // Invalidar primero evita que un evento close/error tardío cambie la UI.
    this.socket = null;
    clearTimeout(this.timer);
    this.timer = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  }

  disconnect() {
    this.release();
    this.onStateChange('disconnected', 'Desconectado. Puedes cambiar la configuración y volver a conectar.');
  }
}
