from backend.domain.pedido.carrinho import PedidoCliente

class FilaDePedidosDaCozinha:
    _instancia = None 

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super(FilaDePedidosDaCozinha, cls).__new__(cls)
            cls._instancia._pedidos_pendentes = []
            cls._instancia._pedidos_prontos = []
        return cls._instancia

    def receber_pedido(self, pedido: PedidoCliente):
        """Adiciona o pedido na fila da cozinha."""
        self._pedidos_pendentes.append(pedido)

    def marchar_proximo_pedido(self) -> PedidoCliente:
        """Retira o pedido mais antigo da fila (FIFO)."""
        if not self._pedidos_pendentes:
            return None
        pedido_concluido = self._pedidos_pendentes.pop(0)
        self._pedidos_prontos.append(pedido_concluido)
        return pedido_concluido

    def listar_pendentes(self) -> list[str]:
        """Retorna apenas o nome dos clientes que estão aguardando."""
        return [pedido.nome_cliente for pedido in self._pedidos_pendentes]