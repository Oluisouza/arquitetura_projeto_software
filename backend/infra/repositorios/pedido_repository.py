from datetime import datetime, timedelta, timezone
from backend.infra.database import get_db_conexao

class PedidoRepository:
    """
    Padrão Arquitetural: Repository.
    Isola os comandos de banco de dados do resto do sistema.
    """
    def __init__(self):
        self.db = get_db_conexao()

    def salvar_pedido_pago(self, nome_cliente: str, item_preparado: str, total: float, metodo: str) -> dict:
        dados = {
            "nome_cliente": nome_cliente,
            "item_preparado": item_preparado,
            "total_pago": total,
            "metodo_pagamento": metodo,
            "status": "Na fila da cozinha"
        }
        resposta = self.db.table("pedidos").insert(dados).execute()
        return resposta.data[0]

    def contar_por_status(self) -> dict:
        resp = self.db.table("pedidos").select("status").execute()
        fila    = sum(1 for r in resp.data if r["status"] == "Na fila da cozinha")
        preparo = sum(1 for r in resp.data if r["status"] == "Em preparo")
        pronto  = sum(1 for r in resp.data if r["status"] == "Pronto")
        return {"fila": fila, "preparo": preparo, "pronto": pronto}

    def listar_pedidos_cozinha(self) -> list[dict]:
        limite = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        resp = (
            self.db.table("pedidos")
            .select("*")
            .gte("criado_em", limite)
            .order("criado_em", desc=False)
            .execute()
        )
        return resp.data

    def atualizar_status(self, pedido_id: str, novo_status: str) -> dict | None:
        resp = (
            self.db.table("pedidos")
            .update({"status": novo_status})
            .eq("id", pedido_id)
            .execute()
        )
        return resp.data[0] if resp.data else None

    def marchar_pedido(self, pedido_id: str) -> dict | None:
        """
        Marca o pedido como entregue ao cliente.
        Mantém o registro no banco para auditoria — nunca deleta.
        """
        resp = (
            self.db.table("pedidos")
            .update({"status": "Entregue"})
            .eq("id", pedido_id)
            .execute()
        )
        return resp.data[0] if resp.data else None

    def buscar_pronto_nao_notificado(self, ids_notificados: set) -> dict | None:
        """Retorna o pedido mais antigo com status Pronto ainda não notificado ao PDV."""
        resp = (
            self.db.table("pedidos")
            .select("id, nome_cliente")
            .eq("status", "Pronto")
            .order("criado_em", desc=False)
            .limit(20)
            .execute()
        )
        for row in resp.data:
            if str(row["id"]) not in ids_notificados:
                return row
        return None
