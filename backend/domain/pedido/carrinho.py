from abc import ABC, abstractmethod
from backend.domain.itens.base import ItemCafeteria

class Comando(ABC):
    """
    Interface base para todos os comandos do sistema.
    Garantir que cada ação saiba se executar e como desfazer.
    """

    @abstractmethod
    def executar(self):
        pass

    @abstractmethod
    def desfazer(self):
        pass

class PedidoCliente:
    """
    Represneta o estado atual do pedido do cliente.
    """

    def __init__(self, nome_cliente: str):
        self.nome_cliente = nome_cliente
        self.itens: list[ItemCafeteria] = []
        self._historico_comandos: list[Comando] = []

    def adicionar_item(self, item: ItemCafeteria):
        self.itens.append(item)
    
    def remover_item(self, item: ItemCafeteria):
        if item in self.itens:
            self.itens.remove(item)

    def calcular_total(self) -> float:
        return sum(item.get_preco() for item in self.itens)
    
    def registrar_e_executar_comando(self, comando: Comando):
        comando.executar()
        self._historico_comandos.append(comando)

    def desfazer_ultimo_comando(self):
        if not self._historico_comandos:
            return "Nada para desfazer."
        
        ultimo_comando = self._historico_comandos.pop()
        ultimo_comando.desfazer()
        return "Última ação desfeita."
    
class ComandoAdicionarItem(Comando):
    """
    Encapsula a ação de adicionar um item específico a um pedido especifico
    """
    def __init__(self, pedido: PedidoCliente, item: ItemCafeteria):
        self.pedido = pedido
        self.item = item

    def executar(self):
        self.pedido.adicionar_item(self.item)

    def desfazer(self):
        self.pedido.remover_item(self.item)
        