# test_client_secure.py
import asyncio
import ssl
import websockets

async def main():
    # Como el certificado es autofirmado, el cliente no confía en él por defecto.
    # Para esta prueba local, desactivamos esa validación.
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    uri = "wss://localhost:8443/ws/Alice"
    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        await websocket.send("Hello Bob")
        await asyncio.sleep(5)

asyncio.run(main())