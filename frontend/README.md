# Frontend · Entre líneas

Interfaz estática con HTML, CSS y JavaScript nativos, sin dependencias nuevas.

## Ejecutar

Desde la raíz del repositorio:

```sh
python -m http.server 5173 --bind 127.0.0.1 --directory frontend
```

Abrir http://localhost:5173. La entrega 2 permite configurar, abrir y cerrar una
conexión WebSocket real. No envía ni presenta mensajes todavía (entrega 3).
La configuración permanece en el formulario mientras la página esté abierta;
no se almacena al recargar. El chat vacío y el envío deshabilitado son intencionales.

## Partes de la interfaz

- `index.html`: identidad, formulario de conexión, sala y referencia de Wireshark.
- `styles.css`: colores, componentes reutilizables y adaptación a pantallas pequeñas.
- `app.js`: validación de nombre/host y construcción segura del endpoint mediante
  `encodeURIComponent`; actualiza estados y bloquea la configuración durante la
  conexión. Usa `textContent` para mostrar entradas del usuario.
- `connection.js`: administra un único WebSocket, los eventos `open`, `error` y
  `close`, cancelación y timeout de 10 segundos. Ignora eventos de sockets antiguos.

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

El botón para enviar sigue deshabilitado hasta la entrega 3. La conexión se cierra
al abandonar la página y no se reconecta automáticamente. El navegador no informa
la causa exacta de los errores WebSocket; las indicaciones son posibles comprobaciones.

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
2. **Tú:** conexión WebSocket, estados y desconexión (esta entrega).
3. **Lasso:** envío y recepción, mensajes propios y ajenos, historial de sesión.
4. **Lasso:** cambio WS/WSS, reconexión y orientación de certificados.
5. **Salazar:** errores, accesibilidad y pulido de la experiencia.
6. **Salazar:** pruebas integrales, guía Wireshark y guion de video en inglés.

Los responsables indican cómo repartir el trabajo; no se suplanta la autoría Git.
