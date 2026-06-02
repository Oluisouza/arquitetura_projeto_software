from abc import ABC, abstractmethod

class IProdutoRepository(ABC):
    """
    Contrato que qualquer repositório de produtos deve cumprir.
    """
    @abstractmethod
    def listar_produtos(self) -> list:
        pass