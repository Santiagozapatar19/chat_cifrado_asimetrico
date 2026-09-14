# Chat Cifrado vs. No Cifrado

Backend en Python (FastAPI + WebSockets) que expone un chat en dos modos: **sin cifrar** (`ws://`) y **cifrado** (`wss://` con TLS), para comparar el tráfico con Wireshark.

## Requisitos

- Python 3.9+
- OpenSSL (viene con Git Bash en Windows, o instalado nativo en Linux/Mac)

## Instalación

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
source venv/Scripts/activate   # Windows (Git Bash)
# source venv/bin/activate      # Linux / Mac

# Instalar dependencias
pip install -r requirements.txt
```

Si no existe `requirements.txt`, generarlo así (una vez instaladas las dependencias manualmente):

```bash
pip install fastapi "uvicorn[standard]" websockets
pip freeze > requirements.txt
```

## Generar certificado TLS (solo una vez, para el modo cifrado)

```bash
# Windows (Git Bash) — usar doble barra por el path conversion de MINGW
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "//CN=localhost"

# Linux / Mac
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

Esto genera `key.pem` (llave privada) y `cert.pem` (certificado público) dentro de `backend/`. **No subir `key.pem` a un repositorio público** (agregar `*.pem` al `.gitignore`).

## Correr el servidor

### Modo 1 — Sin cifrar (`ws://`)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

- Endpoint: `ws://localhost:8000/ws/{username}`
- Ejemplo: `ws://localhost:8000/ws/Alice`

### Modo 2 — Cifrado (`wss://`)

```bash
uvicorn main:app --host 0.0.0.0 --port 8443 --ssl-keyfile key.pem --ssl-certfile cert.pem
```

- Endpoint: `wss://localhost:8443/ws/{username}`
- Ejemplo: `wss://localhost:8443/ws/Alice`

> El código de `main.py` es el mismo para ambos modos — la diferencia está solo en los flags con los que se levanta uvicorn.

## Probar sin frontend (clientes de prueba)

Con el servidor corriendo en una terminal, en otra terminal:

```bash
# Modo sin cifrar (requiere servidor en puerto 8000)
python test/test_client.py

# Modo cifrado (requiere servidor en puerto 8443)
python test/test_client_secure.py
```

Cada script se conecta, envía un mensaje de prueba ("Hello Bob") y se mantiene abierto un momento para poder capturar el tráfico con Wireshark.

## Analizar con Wireshark

1. Capturar en la interfaz **loopback** (`Adapter for loopback traffic capture` en Windows, `lo`/`lo0` en Linux/Mac).
2. Filtrar por puerto según el modo:
- tcp.port == 8000 # sin cifrar
- tcp.port == 8443 # cifrado
3. Generar tráfico corriendo servidor + cliente de prueba.
4. Clic derecho sobre un paquete de datos → **Follow → TCP Stream**:
   - Modo sin cifrar: se ve el mensaje en texto legible.
   - Modo cifrado: solo se ven bytes ilegibles (`Application Data` de TLS).


