# Demostración y sustentación

## Preparar el laboratorio

El frontend no tiene dependencias de terceros. Usa el entorno Python del proyecto
para FastAPI, Uvicorn y websockets. El `requirements.txt` actual contiene comandos
de terminal: no es una lista válida para `pip install -r`. Sin editar el backend,
la instalación directa documentada por el proyecto es:

```sh
python -m pip install fastapi "uvicorn[standard]" websockets
```

Desde la raíz, en tres terminales con el entorno activado:

```sh
python -m http.server 5173 --bind 127.0.0.1 --directory frontend
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8443 --ssl-keyfile RUTA/key.pem --ssl-certfile RUTA/cert.pem
```

Los tres comandos se ejecutan por separado. Abrir dos ventanas de
http://localhost:5173 y usar nombres diferentes. La tercera terminal necesita un
certificado y su clave privada, almacenados fuera del código entregado. El README
raíz incluye un ejemplo de OpenSSL; para navegadores modernos, el certificado
también debe incluir el host/IP en `subjectAltName` y ser confiable en el equipo.
Un certificado autofirmado por sí solo no cumple la confianza del navegador.
Pedir al responsable del laboratorio la configuración de confianza apropiada.

Para probar entre equipos, ejecutar los servidores con `--host 0.0.0.0`, y el
servidor estático con `--bind 0.0.0.0`, en una red de laboratorio autorizada. Usar
la IP del equipo servidor, nunca `localhost` en el otro equipo. Permitir solo los
puertos del laboratorio en el firewall. El certificado debe cubrir esa IP o DNS.

## Secuencia de la demostración

1. Iniciar captura antes de conectar para incluir el handshake HTTP/WebSocket.
2. Conectar Alice y Bob al mismo host con **Texto plano**. Enviar
   `LAB_CHAT_2026: visible message` y responder desde Bob.
3. Verificar en ambos chats la identidad y el transporte; los mensajes propios
   son locales y los ajenos llegan mediante el broadcast del servidor.
4. Cambiar **ambas** instancias a **Cifrado TLS**. Esperar **Conectado · TLS** en
   las dos; si aparece un error de certificado, corregir la preparación TLS antes
   de grabar. No presentar un error como una demostración de cifrado exitosa.
5. Enviar `LAB_CHAT_2026: protected message`. El texto se ve en los extremos,
   mientras la captura sin secretos de sesión muestra datos TLS cifrados.
6. Volver ambas instancias a Texto plano y enviar otro mensaje. El cambio es
   reversible, y no reenvía mensajes anteriores ni borra el borrador.
7. Mostrar brevemente una desconexión y explicar los estados de error.

## Wireshark

En el mismo equipo, elegir **Adapter for loopback traffic capture** (Windows),
`lo` (Linux) o `lo0` (macOS). En equipos distintos, elegir la interfaz de la red
usada. Capturar solo el tráfico de la práctica.

Filtros de visualización:

```text
tcp.port == 8000
tcp.port == 8443
websocket
tls
```

Para WS, seleccionar una trama de datos y usar **Follow → WebSocket Stream**
cuando esté disponible, o inspeccionar los datos del disector WebSocket.
No concluir que hay cifrado solo porque **Follow TCP Stream** muestra bytes raros:
las tramas del cliente usan una máscara reversible y puede negociarse compresión.
La máscara viaja en el protocolo y no aporta confidencialidad.
[RFC 6455, secciones 5.3 y 10.3](https://www.rfc-editor.org/rfc/rfc6455).

Si Wireshark no reconoce el protocolo, reconectar durante la captura y comprobar
la solicitud HTTP Upgrade. Se puede usar **Decode As → HTTP** en el puerto 8000.
La guía oficial explica cómo seguir flujos de TCP, TLS y WebSocket:
[Following Protocol Streams](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html).

Para WSS, mostrar el handshake y registros **Application Data** en el puerto 8443.
Si el puerto no se reconoce automáticamente, usar **Decode As → TLS** para 8443.
La IP, puerto, tamaño y tiempos siguen siendo observables. Para esta comparación,
no cargar claves de sesión TLS en Wireshark; si las tiene, puede descifrar el
tráfico. Que un string no aparezca en una búsqueda no constituye por sí solo una
prueba criptográfica: identificar el protocolo TLS y confirmar la entrega en Bob.

## Cómo justificar la criptografía

| Concepto | Uso y criterio |
| --- | --- |
| Simétrico | Protege eficientemente muchos mensajes usando secretos compartidos. El reto es establecerlos de manera segura. |
| Asimétrico | Permite mecanismos de autenticación y establecimiento de claves con claves públicas/privadas. No es apropiado cifrar cada mensaje largo directamente con RSA. |
| Híbrido | Combina mecanismos asimétricos de autenticación/acuerdo de claves con cifrado simétrico para el tráfico. Es la opción adecuada para una conexión de chat protegida mediante TLS con certificados. |

En TLS 1.3 con certificados, la autenticación usa firmas y puede establecerse un
secreto mediante (EC)DHE; los datos se protegen con AEAD simétrico, por ejemplo
AES-GCM o ChaCha20-Poly1305. No afirmar que RSA cifra cada mensaje ni que una
suite concreta se negoció sin observarla. Existen variantes con PSK y reanudación.
[RFC 8446, secciones 2 y 5](https://www.rfc-editor.org/rfc/rfc8446).

**Alcance académico:** esta aplicación utiliza TLS; no implementa tres algoritmos
independientes a nivel de mensaje. Consultar al docente si explicar y demostrar
los componentes de TLS satisface la rúbrica. Si exige tres modos explícitos, esta
entrega necesita una ampliación acordada; el frontend por sí solo no la sustituye.

**No es cifrado de extremo a extremo:** TLS termina en el servidor, que recibe el
texto claro y lo retransmite. Los nombres tampoco están autenticados: otro cliente
puede elegir el mismo nombre. Los dos puertos son procesos con salas separadas.

## Preguntas para la sustentación

- ¿Por qué WebSocket? Mantiene una conexión bidireccional para recibir mensajes
  sin pedir repetidamente al servidor si hay novedades.
- ¿Por qué vemos nuestro mensaje si el servidor no devuelve eco? El frontend lo
  agrega tras `send`; esto no confirma que otro usuario lo haya recibido.
- ¿Dónde está el historial? Solo en el DOM del navegador, hasta 200 mensajes.
- ¿Cómo evitan ejecutar HTML recibido? Los textos se asignan con `textContent`.
- ¿Por qué cambiar de modo reconecta? TLS se establece al abrir la conexión.
- ¿Qué pasa al caer el servidor? El envío se deshabilita, se conserva el borrador
  y se permite conectar otra vez. No se garantiza entrega ni se reenvía a ciegas.
- ¿Quién cifra? La implementación TLS del navegador y del servidor; no JavaScript
  manual ni un algoritmo inventado en el frontend.
