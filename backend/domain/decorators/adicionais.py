from backend.domain.decorators.base_decorator import AdicionalDecorator
from backend.domain.itens.base import ItemCafeteria

class DecoradorDinamico(AdicionalDecorator):
    """
    Decorator Dinâmico: Pode ser Leite, Chantilly, Nutella, Mel...
    Ele pega os dados do banco e 'abraça' a bebida original.
    """
    def __init__(self, item_base: ItemCafeteria, nome_adicional: str, preco_adicional: float):
        super().__init__(item_base)
        self._nome_adicional = nome_adicional
        self._preco_adicional = preco_adicional

    def get_nome(self) -> str:
        return f"{self._item_base.get_nome()} + {self._nome_adicional.capitalize()}"

    def get_preco(self) -> float:
        return self._item_base.get_preco() + float(self._preco_adicional)