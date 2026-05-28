from abc import ABC, abstractmethod

class ItemCafeteria(ABC):
    """
    Interface base para todos os itens da cafeteria
    """

    @abstractmethod
    def get_nome(self) -> str:
        pass

    @abstractmethod
    def get_preco(self) -> float:
        pass