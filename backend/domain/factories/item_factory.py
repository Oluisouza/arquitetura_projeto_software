from backend.domain.itens.bebidas import ItemDinamico
from backend.domain.itens.base import ItemCafeteria
from backend.infra.repositorios.produto_repository import ProdutoRepository

class ItemFactory:
    """
    Padrão Factory Dinâmico: Busca no banco e instancia o objeto em tempo de execução.
    """
    @staticmethod
    def criar_item(nome_item: str) -> ItemCafeteria:
        repo = ProdutoRepository()
        produtos = repo.listar_produtos()
        
        for p in produtos:
            if p["nome"].lower() == nome_item.lower():
                return ItemDinamico(p["nome"], p["preco"])
                
        raise ValueError(f"O item '{nome_item}' não existe no cardápio do banco de dados.")