from itens.base import ItemCafeteria

class Espresso(ItemCafeteria):
    def get_nome(self) -> str:
        return "Café Espresso"
    
    def get_preco(self) -> float:
        return 5.00
    
class Cappuccino(ItemCafeteria):
    def get_nome(self) -> str:
        return "Cappuccino tradicional"
    
    def get_preco(self) -> float:
        return 8.50
    
