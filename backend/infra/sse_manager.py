import asyncio
from typing import AsyncGenerator

class SSEManager:
    """
    Gerencia todas as conexões SSE abertas.
    Quando um evento ocorre, notifica todos os clientes conectados.
    
    Conecta o padrão Observer ao contexto web:
    este manager é o "sujeito" que notifica os "observadores" (browsers).
    """

    def __init__(self):
        self._filas: list[asyncio.Queue] = []

    def conectar(self) -> asyncio.Queue:
        """Registra um novo cliente SSE e retorna sua fila de eventos."""
        fila = asyncio.Queue()
        self._filas.append(fila)
        return fila

    def desconectar(self, fila: asyncio.Queue):
        """Remove o cliente quando a conexão é encerrada."""
        if fila in self._filas:
            self._filas.remove(fila)

    async def emitir(self, evento: str, dados: dict):
        """
        Envia um evento para todos os clientes conectados.
        Chamado pelo backend quando um status de pedido muda.
        """
        import json
        mensagem = f"event: {evento}\ndata: {json.dumps(dados)}\n\n"
        for fila in list(self._filas):
            await fila.put(mensagem)

    async def stream(self, fila: asyncio.Queue) -> AsyncGenerator[str, None]:
        """
        Gerador assíncrono que produz eventos para um cliente específico.
        Manda um heartbeat a cada 20s para manter a conexão viva no Render.
        """
        try:
            while True:
                try:
                    mensagem = await asyncio.wait_for(fila.get(), timeout=20)
                    yield mensagem
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass


sse_manager = SSEManager()