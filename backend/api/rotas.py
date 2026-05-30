from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase
from backend.domain.fechamento_conta.strategy import FechamentoPix, FechamentoCartao, FechamentoDinheiro
from backend.domain.pedido.carrinho import PedidoCliente
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha
from backend.infra.repositorios.pedido_repository import PedidoRepository

app = FastAPI(
    title="API Cafeteria PDV",
    description="Microsserviço de Atendimento (PDV) - Arquitetura Limpa",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
    

class RequisicaoPedido(BaseModel):
    nome_cliente: str
    bebida_base: str
    adicionais: list[str] = [] 

class RequisicaoPagamento(BaseModel):
    valor_total: float
    metodo_pagamento: str 
    nome_cliente: str

@app.post("/pedidos/novo")
def criar_novo_pedido(requisicao: RequisicaoPedido):
    """
    Rota para o Tablet (React) enviar um novo pedido.
    """
    try:
        use_case = CriarPedidoUseCase()
        
        resultado = use_case.executar(
            nome_cliente=requisicao.nome_cliente,
            bebida_base=requisicao.bebida_base,
            adicionais=requisicao.adicionais
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

    # Executa a ação do Strategy
    mensagem_fechamento = estrategia.finalizar_conta(requisicao.valor_total)

    # INTEGRAÇÃO COM A COZINHA (Fila Singleton em Memória)
    fila_cozinha = FilaDePedidosDaCozinha() 
    pedido_fechado = PedidoCliente(requisicao.nome_cliente) 
    fila_cozinha.receber_pedido(pedido_fechado)

    # ==========================================
    # PERSISTÊNCIA NA NUVEM (Padrão Repository)
    # ==========================================
    try:
        repo = PedidoRepository()
        pedido_salvo = repo.salvar_pedido_pago(
            nome_cliente=requisicao.nome_cliente,
            item_preparado="Pedido Customizado",
            total=requisicao.valor_total,
            metodo=metodo
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar no banco: {str(e)}")

    return {
        "mensagem": mensagem_fechamento,
        "id_pedido_banco": pedido_salvo["id"]
    }