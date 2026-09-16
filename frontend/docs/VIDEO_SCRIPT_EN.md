# English video script — approximately 4 minutes

Use the real screen recording. Prepare both servers and browser certificate
trust first. Do not read the TLS success section if the connection has failed.

## 0:00–0:35 — Introduce the application

“This is Entre líneas, our chat laboratory. The frontend uses HTML, CSS, and
JavaScript. The backend uses Python, FastAPI, and WebSockets. We can open multiple
instances, exchange text messages, and switch between plain WebSocket and
WebSocket protected by TLS.”

Show the two windows and enter Alice and Bob.

## 0:35–1:20 — Plain communication

“Both users are connected to the same server on port 8000. I will send a message
from Alice and reply from Bob. Our own message appears locally because the backend
broadcasts only to the other clients. The interface does not claim that a message
was delivered: the backend has no delivery acknowledgements.”

Send `LAB_CHAT_2026: visible message`, then reply. Show Wireshark.

“With this port filter, we can inspect the WebSocket message. Client frames are
masked, but masking is reversible and is not encryption. We use the WebSocket
dissector to inspect the decoded content.”

## 1:20–2:10 — TLS communication

Switch both windows to TLS and wait for the connected status.

“Now both users are connected through TLS on port 8443. Switching transport opens
a new connection. Our two server processes have separate rooms, so both users
must select the same transport.”

Send `LAB_CHAT_2026: protected message`, show receipt and the packet capture.

“The receiving user can read the message, but the capture shows TLS application
data. Without the session secrets, the message is not available as plain text.
Addresses, packet sizes, and timing are still visible.”

## 2:10–3:00 — Explain the choice

“Symmetric encryption is efficient for protecting many messages, but the peers
need shared secrets. Asymmetric cryptography supports authentication and key
establishment. A hybrid approach combines these roles. TLS with certificates is
appropriate for protecting the client-to-server channel.”

“We are using TLS rather than implementing three separate message-encryption
algorithms. This is also not end-to-end encryption: the server receives plaintext
and forwards it. The usernames are labels, not authenticated identities.”

## 3:00–4:00 — Recovery and implementation

Return both clients to plain mode and send a final message. Show disconnect and
the preserved draft; show the responsive layout.

“The connection module handles opening, closing, errors, and timeouts. The app
module updates the controls, and the message module renders text safely. We limit
the local history to two hundred messages. It disappears when the page reloads.”

“We tested two-way communication, reconnection, Unicode, multiline text, and
connection failures. The frontend reports errors and preserves unsent drafts.
This demonstration lets us compare the same chat flow with and without TLS.”
