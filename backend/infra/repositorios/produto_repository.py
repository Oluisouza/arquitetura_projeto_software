from backend.infra.database import get_db_conexao

class ProdutoRepository:
    """
    Padrão Repository: Lida com a tabela de Produtos do Cardápio.
    """
    def __init__(self):
        self.db = get_db_conexao()

    def adicionar_produto(self, nome: str, preco: float, categoria: str):
        dados = {
            "nome": nome.lower(), # Salva sempre em minúsculo para facilitar a busca
            "preco": preco,
            "categoria": categoria.lower()
        }
        resposta = self.db.table("produtos").insert(dados).execute()
        return resposta.data[0]

    def listar_produtos(self):
        resposta = self.db.table("produtos").select("*").execute()
        return resposta.data