# test_client.py
import asyncio
import websockets

async def main():
    uri = "ws://localhost:8000/ws/Alice"
    async with websockets.connect(uri) as websocket:
        await websocket.send("Hello Bob")
        # deja la conexión abierta un momento para poder capturar tráfico
        await asyncio.sleep(5)

asyncio.run(main())