# Verificación de la entrega

## Comprobaciones realizadas

- Diez pruebas automáticas de conexión y parsing, sin bibliotecas adicionales.
- Integración contra el backend intacto, con dos clientes reales por WS (8000)
  y WSS (8443): contenido exacto, Unicode, saltos de línea, respuesta, ausencia de
  eco al emisor, aviso de desconexión y envío tras reconectar.
- TLS probado con un certificado local confiado explícitamente solo por el
  proceso Node mediante `NODE_EXTRA_CA_CERTS`. La verificación permaneció activa.
- Dos instancias de navegador intercambiaron mensajes por WS. El HTML recibido
  se mostró como texto, sin crear elementos HTML. Se probó el envío con Enter.
- El cambio a WSS con certificado no confiable mostró un error recuperable.
  Al volver a WS, se conservaron historial y borrador y se recuperó la conexión.
- El historial se limitó a 200 elementos tras recibir más de 205 mensajes. Un
  mensaje externo de 12000 caracteres se recortó en la vista, sin desbordamiento.
- Se comprobó el botón para volver a los mensajes nuevos.
- Diseño revisado en navegador a 1366 px (dos columnas) y 390 px (una columna).
  El ancho del contenido no excedió el viewport en ninguna de las dos vistas.
- Captura de 172 paquetes con TShark, componente de Wireshark, limitada a loopback
  y puertos 8000/8443. Se recuperó el texto `LAB_CHAT_2026` del payload WebSocket
  en 8000. En 8443, al decodificar como TLS, se observó TLS 1.3 y Application Data,
  sin claves de sesión cargadas. La captura acompaña el paquete de patches como
  evidencia de prueba, no como sustituto de la demostración de los estudiantes.
- No se cambiaron archivos del backend ni se incorporaron dependencias frontend.

## Pendientes del entorno de la presentación

- Confiar apropiadamente en el certificado TLS del laboratorio en **cada
  navegador**. WSS exitoso fue probado con clientes Node; en el navegador solo
  se comprobó el rechazo del certificado no confiable y la recuperación.
- Repetir WSS desde ambos navegadores una vez preparado el certificado.
- Repetir en dos equipos si esa es la topología elegida para el video; las pruebas
  realizadas usaron múltiples instancias en el mismo equipo.
- Confirmar con el docente el alcance criptográfico: se usa TLS, no tres modos
  independientes de cifrado a nivel de mensaje. Ver [DEMO.md](DEMO.md).
- Grabar el video en inglés usando [el guion](VIDEO_SCRIPT_EN.md).

## Repetir las pruebas

Desde la raíz, con Node 22 o posterior:

```sh
node --check frontend/app.js
node --check frontend/connection.js
node --check frontend/messages.js
node --test frontend/test/connection.test.cjs frontend/test/messages.test.cjs
node frontend/test/integration.cjs
```

El último comando requiere el servidor WS activo. Ejemplo de prueba WSS en
PowerShell con el servidor TLS ya activo y el certificado confiable del laboratorio:

```powershell
$env:CHAT_TEST_URL = 'wss://localhost:8443'
$env:NODE_EXTRA_CA_CERTS = (Resolve-Path 'RUTA/cert.pem').Path
try { node frontend/test/integration.cjs }
finally {
    Remove-Item Env:\CHAT_TEST_URL
    Remove-Item Env:\NODE_EXTRA_CA_CERTS
}
```

Pruebas manuales: nombre vacío, dirección con protocolo o puerto, servidor
inaccesible, cancelar conexión, mensaje vacío, Shift + Enter, desconexión,
alternancia en ambos clientes, lectura del historial y recarga sin persistencia.
