from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase
from backend.domain.fechamento_conta.strategy import FechamentoPix, FechamentoCartao, FechamentoDinheiro
from backend.domain.pedido.carrinho import PedidoCliente
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha

app = FastAPI(
    title="API Cafeteria PDV",
    description="Microsserviço de Atendimento (PDV) - Arquitetura Limpa",
    version="1.0.0"
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
    Rota para o PDV processar o pagamento usando o Padrão Strategy.
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


    return {"mensagem": mensagem_fechamento}