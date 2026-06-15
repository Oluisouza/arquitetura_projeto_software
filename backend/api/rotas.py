from fastapi import FastAPI, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os

from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase
from backend.domain.fechamento_conta.strategy import FechamentoPix, FechamentoCartao, FechamentoDinheiro
from backend.domain.pedido.carrinho import PedidoCliente
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha
from backend.infra.repositorios.pedido_repository import PedidoRepository
from backend.infra.repositorios.produto_repository import ProdutoRepository
from backend.infra.sse_manager import sse_manager
from backend.infra.database import get_db_conexao
from backend.api.autenticacao import router as auth_router, requer_papel

app = FastAPI(
    title="API Cafeteria PDV",
    description="Microsserviço de Atendimento (PDV) - Arquitetura Limpa",
    version="1.0.0"
)

app.include_router(auth_router)

origens = ["http://localhost:5173"]
if os.environ.get("FRONTEND_URL"):
    origens.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

class RequisicaoProduto(BaseModel):
    nome:       str
    preco:      float
    categoria:  str
    imagem_url: str = None


@app.post("/produtos", dependencies=[Depends(requer_papel("gerente"))])
def criar_produto(requisicao: RequisicaoProduto):
    """
    Cria um novo produto no cardápio.
    Usado pela tela Admin. Protegido: apenas gerente.
    """
    try:
        repo = ProdutoRepository()
        produto = repo.adicionar_produto(
            nome=requisicao.nome,
            preco=requisicao.preco,
            categoria=requisicao.categoria,
        )
        if requisicao.imagem_url:
            supabase_db = get_db_conexao()
            supabase_db.table("produtos").update(
                {"imagem_url": requisicao.imagem_url}
            ).eq("id", produto["id"]).execute()
            produto["imagem_url"] = requisicao.imagem_url

        return {"mensagem": "Produto criado com sucesso!", "dados": produto}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pedidos/novo", dependencies=[Depends(requer_papel("atendente", "gerente"))])
def criar_novo_pedido(requisicao: RequisicaoPedido):
    """
    Rota para o Tablet enviar um novo pedido.
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

@app.post("/pedidos/pagar", dependencies=[Depends(requer_papel("atendente", "gerente"))])
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


@app.patch(
    "/pedidos/{pedido_id}/status",
    dependencies=[Depends(requer_papel("atendente", "cozinha", "gerente"))],
)
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
            "X-Accel-Buffering":           "no",   
            "Access-Control-Allow-Origin": "*",
        },
    )

@app.post("/produtos/upload-imagem", dependencies=[Depends(requer_papel("gerente"))])
async def upload_imagem(arquivo: UploadFile):
    try:
        db       = get_db_conexao()
        conteudo = await arquivo.read()
        ext      = arquivo.filename.split('.')[-1]
        caminho  = f"{int(__import__('time').time())}.{ext}"

        print(f">>> Tentando upload: {caminho}, tamanho: {len(conteudo)} bytes")

        db.storage.from_("imagens-produtos").upload(
            caminho, conteudo,
            {"content-type": arquivo.content_type, "upsert": "true"}
        )

        print(">>> Upload ok, buscando URL...")

        url = db.storage.from_("imagens-produtos").get_public_url(caminho)

        print(f">>> URL gerada: {url}")

        return {"url": url}
    except Exception as e:
        print(f">>> ERRO NO UPLOAD: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/produtos/{produto_id}", dependencies=[Depends(requer_papel("gerente"))])
async def editar_produto(produto_id: str, requisicao: RequisicaoProduto):
    """Edita um produto existente. Protegido: apenas gerente."""
    try:
        db = get_db_conexao()
        payload = {
            "nome":      requisicao.nome,
            "preco":     requisicao.preco,
            "categoria": requisicao.categoria,
        }
        if requisicao.imagem_url:
            payload["imagem_url"] = requisicao.imagem_url

        resposta = db.table("produtos").update(payload).eq("id", produto_id).execute()
        return {"mensagem": "Produto atualizado!", "dados": resposta.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))