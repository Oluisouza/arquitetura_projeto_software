from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase
from backend.domain.fechamento_conta.strategy import FechamentoPix, FechamentoCartao, FechamentoDinheiro
from backend.domain.pedido.carrinho import PedidoCliente
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha
from backend.infra.repositorios.pedido_repository import PedidoRepository
from backend.infra.repositorios.produto_repository import ProdutoRepository
from fastapi.responses import StreamingResponse
from backend.infra.sse_manager import sse_manager
import os

app = FastAPI(
    title="API Cafeteria PDV",
    description="Microsserviço de Atendimento (PDV) - Arquitetura Limpa",
    version="1.0.0"
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)

class ItemRequisicao(BaseModel):
    bebida_base: str
    adicionais: list[str] = []    

class RequisicaoPedido(BaseModel):
    nome_cliente: str
    itens: list[ItemRequisicao]

class RequisicaoPagamento(BaseModel):
    valor_total: float
    metodo_pagamento: str 
    nome_cliente: str
    item_preparado: str = "Pedido"

class RequisicaoStatus(BaseModel):
    status: str

@app.post("/pedidos/novo")
def criar_novo_pedido(requisicao: RequisicaoPedido):
    """
    Rota para o Tablet (React) enviar um novo pedido.
    """
    try:
        use_case = CriarPedidoUseCase()
        
        resultado = use_case.executar(
            nome_cliente=requisicao.nome_cliente,
            itens_carrinho=[item.model_dump() for item in requisicao.itens]
        )
        
        return {"mensagem": "Pedido criado com sucesso!", "dados": resultado}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/pedidos/pagar")
async def pagar_pedido(requisicao: RequisicaoPagamento):
    """
    Rota para o PDV processar o pagamento usando o Padrão Strategy e persistir no DB.
    """
    metodo = requisicao.metodo_pagamento.lower()
    estrategia = None

    if metodo == "pix":
        estrategia = FechamentoPix()
    elif metodo == "cartao":
        estrategia = FechamentoCartao()
    elif metodo == "dinheiro":
        estrategia = FechamentoDinheiro()
    else:
        raise HTTPException(status_code=400, detail="Método de pagamento inválido.")

    mensagem_fechamento = estrategia.finalizar_conta(requisicao.valor_total)

    fila_cozinha = FilaDePedidosDaCozinha()
    pedido_fechado = PedidoCliente(requisicao.nome_cliente)
    fila_cozinha.receber_pedido(pedido_fechado)

    try:
        repo = PedidoRepository()
        pedido_salvo = repo.salvar_pedido_pago(
            nome_cliente=requisicao.nome_cliente,
            item_preparado=requisicao.item_preparado,
            total=requisicao.valor_total,
            metodo=metodo
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar no banco: {str(e)}")

    # Notifica a cozinha via SSE que um novo pedido chegou
    await sse_manager.emitir("pedido_novo", {
        "id":             pedido_salvo["id"],
        "nome_cliente":   pedido_salvo["nome_cliente"],
        "item_preparado": pedido_salvo["item_preparado"],
        "total_pago":     pedido_salvo["total_pago"],
        "status":         pedido_salvo["status"],
        "criado_em":      pedido_salvo["criado_em"],
    })

    return {
        "mensagem":       mensagem_fechamento,
        "id_pedido_banco": pedido_salvo["id"]
    }

@app.get("/pedidos/status")
def obter_status_cozinha():
    """
    Retorna contadores por status e lista de pedidos prontos para o PDV.
    """
    try:
        repo = PedidoRepository()
        contagem = repo.contar_por_status()
        pedidos  = repo.listar_pedidos_cozinha()

        prontos = [
            {"id": p["id"], "nome_cliente": p["nome_cliente"], "item_preparado": p["item_preparado"]}
            for p in pedidos if p["status"] == "Pronto"
        ]

        pedido_pronto = prontos[0]["nome_cliente"] if prontos else None

        return {
            **contagem,
            "pedidos_prontos": prontos,
            "pedido_pronto":   pedido_pronto,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/pedidos/{pedido_id}/status")
async def atualizar_status_pedido(pedido_id: str, body: RequisicaoStatus):
    """
    Atualiza o status de um pedido e notifica todos os clientes SSE.
    """
    status_validos = ["Na fila da cozinha", "Em preparo", "Pronto", "Entregue"]

    if body.status not in status_validos:
        raise HTTPException(status_code=400, detail="Status inválido.")

    try:
        repo   = PedidoRepository()
        pedido = repo.atualizar_status(pedido_id, body.status)

        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")

        # Notifica todos os clientes SSE conectados
        await sse_manager.emitir("status_atualizado", {
            "id":           pedido_id,
            "status":       body.status,
            "nome_cliente": pedido.get("nome_cliente", ""),
        })

        return {
            "mensagem": f"Status atualizado para '{body.status}'.",
            "pedido":   pedido,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cardapio")
def obter_cardapio():
    """
    Retorna todos os produtos cadastrados no banco para o React montar os botões.
    """
    try:
        repo = ProdutoRepository()
        produtos = repo.listar_produtos()
        return {"mensagem": "Cardápio carregado", "dados": produtos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar cardápio: {str(e)}")
    
@app.get("/pedidos/cozinha")
def listar_pedidos_cozinha():
    """
    Retorna os pedidos das últimas 24h para o KDS da cozinha.
    Exclui pedidos já entregues.
    """
    try:
        repo    = PedidoRepository()
        pedidos = repo.listar_pedidos_cozinha()
        ativos  = [p for p in pedidos if p["status"] != "Entregue"]
        return {"dados": ativos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/pedidos/stream")
async def stream_pedidos():
    """
    Rota SSE — abre uma conexão persistente com o cliente.
    O browser recebe eventos em tempo real quando pedidos mudam de status.
    Implementa o padrão Observer no contexto web.
    """
    fila = sse_manager.conectar()

    async def gerador():
        try:
            async for evento in sse_manager.stream(fila):
                yield evento
        finally:
            sse_manager.desconectar(fila)

    return StreamingResponse(
        gerador(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",    # essencial para Nginx/Render
            "Access-Control-Allow-Origin": "*",
        },
    )