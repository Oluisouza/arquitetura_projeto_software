from decorators.base_decorator import AdicionalDecorator

class Leite(AdicionalDecorator):
    def get_nome(self) -> str:
        return f"{self._item_base.get_nome()} + Leite"
    
    def get_preco(self) -> float:
        return self._item_base.get_preco() + 2.00
    
class Chantilly(AdicionalDecorator):
    def get_nome(self) -> str:
        return f"{self._item_base.get_nome()} + Chantilly"
    
    def get_preco(self) -> float:
        return self._item_base.get_preco() + 3.50