from backend.domain.itens.bebidas import Espresso, Cappuccino
from backend.domain.itens.base import ItemCafeteria

class ItemFactory:
    """
    Padrão Factory.
    Centraliza a criação.
    """

    @staticmethod
    def criar_item(tipo_item: str) -> ItemCafeteria:
        tipo_item = tipo_item.lower()

        if tipo_item == "espresso":
            return Espresso()
        elif tipo_item == "cappuccino":
            return Cappuccino()
        else:
            raise ValueError(f"O item '{tipo_item}' não existe no menu")
        