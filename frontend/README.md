# Frontend · Entre líneas

Interfaz estática con HTML, CSS y JavaScript nativos, sin dependencias nuevas.

## Ejecutar

Desde la raíz del repositorio:

```sh
python -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Abrir http://localhost:5173. La entrega 4 permite conectar, enviar y recibir
mensajes de texto entre instancias del mismo servidor y transporte.
La configuración permanece en el formulario mientras la página esté abierta;
no se almacena al recargar. El historial vive solo en la página y se pierde al recargar.

## Partes de la interfaz

- `index.html`: identidad, formulario de conexión, sala y referencia de Wireshark.
- `styles.css`: colores, componentes reutilizables y adaptación a pantallas pequeñas.
- `app.js`: validación de nombre/host y construcción segura del endpoint mediante
  `encodeURIComponent`; actualiza estados y bloquea la configuración durante la
  conexión. Usa `textContent` para mostrar entradas del usuario.
- `connection.js`: administra un único WebSocket, los eventos `open`, `error` y
  `close`, cancelación y timeout de 10 segundos. Ignora eventos de sockets antiguos.
- `messages.js`: interpreta el formato de texto del servidor y construye las
  burbujas usando `textContent`, sin interpretar HTML enviado por otro usuario.

## Probar la conexión

Iniciar el backend con las instrucciones del README raíz; para WS, desde `backend`:

```sh
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

1. Escribir un nombre y conectar a `localhost`, con texto plano seleccionado.
2. Verificar el estado **Conectado · WS**, la identidad y los campos bloqueados.
3. Desconectar: los campos vuelven a habilitarse. También se puede cancelar un intento.
4. Con el servidor detenido, intentar conectar: debe aparecer un error y permitir reintentar.
5. Si el servidor no responde, el intento termina a los 10 segundos.

El envío se habilita cuando hay conexión y texto no vacío. Enter envía y
Shift + Enter agrega una línea. Los mensajes propios se muestran localmente porque
el servidor no envía eco al emisor. "Enviado al socket" no garantiza recepción:
el backend no tiene confirmaciones. La conexión se cierra
al abandonar la página y no se reconecta automáticamente. El navegador no informa
la causa exacta de los errores WebSocket; las indicaciones son posibles comprobaciones.

## Cambiar el transporte durante la sesión

Con la conexión activa, seleccionar Texto plano o Cifrado TLS cierra el socket
anterior y abre el nuevo. El borrador y el historial local se conservan; cada
mensaje indica el transporte con el que fue enviado o recibido. Durante la
conexión los controles se bloquean; se puede cancelar. Si falla, se puede cambiar
el modo y pulsar Conectar de nuevo. No hay reenvío automático de mensajes.

Ambas instancias deben cambiar al mismo modo: los servidores WS y WSS no comparten
la lista de conexiones. El panel "Preparar una conexión TLS" ayuda a revisar el
servidor y explica la confianza del certificado. No se desactiva la validación TLS.

Verificaciones sin dependencias adicionales:

```sh
node --check frontend/app.js
node --check frontend/connection.js
node --test frontend/test/connection.test.cjs
```

## Contrato del backend (consultado, sin cambios)

- Única ruta: `/ws/{username}`, conexión WebSocket.
- Cliente → servidor: texto, sin objeto JSON.
- Servidor → otros clientes: `nombre: mensaje`.
- El emisor no recibe eco de su propio mensaje.
- Desconexión: `nombre left the chat` hacia los clientes restantes.
- Sin historial, lista de usuarios, autenticación ni confirmación de entrega.
- WS usa el puerto 8000; WSS usa 8443 según los comandos del README raíz.
- Cada proceso de Uvicorn mantiene su propia sala en memoria. Dos usuarios
  deben coincidir en servidor y transporte para conversar con este despliegue.
- Los mensajes de salida y los de conversación no tienen un tipo estructurado;
  no se deben tratar como una API de presencia inequívoca.

## Límites para la demostración

El backend actual cifra el transporte mediante TLS. No implementa tres modos
independientes de cifrado simétrico, asimétrico e híbrido a nivel de mensaje.
La justificación académica de TLS y cualquier ampliación deben acordarse antes
de alterar el backend. Cambiar WS/WSS requiere abrir una nueva conexión.

Un certificado WSS autofirmado necesita ser confiable para el navegador;
JavaScript no puede desactivar su validación. Una página servida por HTTPS
puede bloquear conexiones WS por contenido mixto: para la práctica local se
sirve este frontend por HTTP.

`backend/requirements.txt` contiene comandos de shell, no requisitos instalables.
Se conserva intacto. Los comandos de instalación directa están en el README raíz.

## Secuencia de commits

1. **Tú:** base visual responsive y configuración validada.
2. **Tú:** conexión WebSocket, estados y desconexión.
3. **Lasso:** envío y recepción, mensajes propios y ajenos, historial de sesión.
4. **Lasso:** cambio WS/WSS, reconexión y orientación de certificados (esta entrega).
5. **Salazar:** errores, accesibilidad y pulido de la experiencia.
6. **Salazar:** pruebas integrales, guía Wireshark y guion de video en inglés.

Los responsables indican cómo repartir el trabajo; no se suplanta la autoría Git.
