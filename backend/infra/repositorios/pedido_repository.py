from backend.infra.database import get_db_conexao

class PedidoRepository:
    """
    Padrão Arquitetural: Repository.
    Isola os comandos de banco de dados do resto do sistema.
    """
    def __init__(self):
        self.db = get_db_conexao()

    def salvar_pedido_pago(self, nome_cliente: str, item_preparado: str, total: float, metodo: str) -> dict:
        """Salva o pedido finalizado na nuvem."""
        
        dados = {
            "nome_cliente": nome_cliente,
            "item_preparado": item_preparado,
            "total_pago": total,
            "metodo_pagamento": metodo,
            "status": "Na fila da cozinha"
        }
        
        resposta = self.db.table("pedidos").insert(dados).execute()
        
        return resposta.data[0]