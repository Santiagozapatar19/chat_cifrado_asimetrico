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
    this.scroller = container.parentElement;
    this.historyNote = document.querySelector('#history-note');
    this.newMessagesButton = document.querySelector('#new-messages');
    this.newMessagesButton.addEventListener('click', () => this.scrollToLatest());
    this.scroller.addEventListener('scroll', () => {
      if (this.isNearBottom()) this.newMessagesButton.hidden = true;
    });
  }

  isNearBottom() {
    return this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight < 80;
  }

  scrollToLatest() {
    this.scroller.scrollTop = this.scroller.scrollHeight;
    this.newMessagesButton.hidden = true;
  }

  append({ author, text, own = false, transport }) {
    const follow = this.isNearBottom() || own || this.container.hidden;
    this.emptyState.hidden = true;
    this.container.hidden = false;
    const item = document.createElement('li');
    item.className = own ? 'message own-message' : 'message';
    const sender = document.createElement('bdi');
    sender.className = 'message-author';
    sender.textContent = own ? `${author} · tú` : author;
    const body = document.createElement('p');
    body.className = 'message-body';
    // Un cliente externo no comparte el límite del formulario de esta interfaz.
    body.textContent = text.length > 10000 ? `${text.slice(0, 10000)}\n[Mensaje recortado en esta vista]` : text;
    const meta = document.createElement('small');
    const time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${time} · ${transport === 'wss' ? 'TLS' : 'Texto plano'}${own ? ' · Enviado al socket' : ''}`;
    item.append(sender, body, meta);
    this.container.append(item);
    if (this.container.children.length > 200) this.container.firstElementChild.remove();
    this.historyNote.textContent = `Historial local · ${this.container.children.length}/200 mensajes · se borra al recargar`;
    if (follow) this.scrollToLatest();
    else this.newMessagesButton.hidden = false;
  }
}
