from backend.domain.itens.base import ItemCafeteria

class ItemDinamico(ItemCafeteria):
    """
    Esta classe assume a forma (nome e preço)
    de qualquer item cadastrado no Banco de Dados.
    """
    def __init__(self, nome: str, preco: float):
        self._nome = nome
        self._preco = preco

    def get_nome(self) -> str:
        return self._nome.capitalize()

    def get_preco(self) -> float:
        return float(self._preco)