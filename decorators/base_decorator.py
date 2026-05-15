from itens.base  import ItemCafeteria

class AdicionalDecorator(ItemCafeteria):
    """
    Padrão Decorator.
    Classe base para adicionais de um ItemCafeteria existente.
    """

    def __init__(self, item_base: ItemCafeteria):
        self._item_base = item_base

    def get_nome(self) -> str:
        return self._item_base.get_nome()
    
    def get_preco(self) -> float:
        return self._item_base.get_preco()