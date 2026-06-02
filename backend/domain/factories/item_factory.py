from backend.domain.itens.bebidas import ItemDinamico
from backend.domain.itens.base import ItemCafeteria

class ItemFactory:
    """
    Padrão Factory: instancia o objeto correto a partir do catálogo já carregado.
    """
    @staticmethod
    def criar_item(nome_item: str) -> ItemCafeteria:
        """Mantido para compatibilidade com o CLI (main.py)."""
        from backend.infra.repositorios.produto_repository import ProdutoRepository
        repo = ProdutoRepository()
        return ItemFactory.criar_item_do_catalogo(nome_item, repo.listar_produtos())

    @staticmethod
    def criar_item_do_catalogo(nome_item: str, catalogo: list) -> ItemCafeteria:
        """Versão eficiente: recebe o catálogo já carregado, sem consulta ao banco."""
        for p in catalogo:
            if p["nome"].lower() == nome_item.lower():
                return ItemDinamico(p["nome"], p["preco"])

        raise ValueError(f"O item '{nome_item}' não existe no cardápio.")