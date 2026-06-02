from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase
from backend.domain.fechamento_conta.strategy import FechamentoPix, FechamentoCartao, FechamentoDinheiro
from backend.domain.pedido.carrinho import PedidoCliente
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha
from backend.infra.repositorios.pedido_repository import PedidoRepository
from backend.infra.repositorios.produto_repository import ProdutoRepository
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
def pagar_pedido(requisicao: RequisicaoPagamento):
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

    return {
        "mensagem": mensagem_fechamento,
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
def atualizar_status_pedido(pedido_id: str, body: RequisicaoStatus):
    status_validos = ["Na fila da cozinha", "Em preparo", "Pronto", "Entregue"]

    if body.status not in status_validos:
        raise HTTPException(status_code=400, detail="Status inválido.")

    try:
        repo   = PedidoRepository()
        pedido = repo.atualizar_status(pedido_id, body.status)
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        return {"mensagem": f"Status atualizado para '{body.status}'.", "pedido": pedido}
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