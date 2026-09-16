// El servidor envía texto: "nombre: mensaje", sin JSON ni confirmaciones.
function parseIncomingMessage(raw) {
  const separator = raw.indexOf(': ');
  return separator > 0
    ? { author: raw.slice(0, separator), text: raw.slice(separator + 2) }
    : { author: 'Servidor', text: raw };
}

class MessageList {
  constructor(container, emptyState) {
    this.container = container;
    this.emptyState = emptyState;
  }

  append({ author, text, own = false, transport }) {
    this.emptyState.hidden = true;
    this.container.hidden = false;
    const item = document.createElement('li');
    item.className = own ? 'message own-message' : 'message';
    const sender = document.createElement('bdi');
    sender.className = 'message-author';
    sender.textContent = own ? `${author} · tú` : author;
    const body = document.createElement('p');
    body.className = 'message-body';
    body.textContent = text;
    const meta = document.createElement('small');
    const time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${time} · ${transport === 'wss' ? 'TLS' : 'Texto plano'}${own ? ' · Enviado al socket' : ''}`;
    item.append(sender, body, meta);
    this.container.append(item);
    item.scrollIntoView({ block: 'nearest' });
  }
}
