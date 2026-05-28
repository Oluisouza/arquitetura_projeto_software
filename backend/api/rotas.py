from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.use_cases.gerenciar_pedido import CriarPedidoUseCase

app = FastAPI(
    title="API Cafeteria PDV",
    description="Microsserviço de Atendimento (PDV) - Arquitetura Limpa",
    version="1.0.0"
)

class RequisicaoPedido(BaseModel):
    nome_cliente: str
    bebida_base: str
    adicionais: list[str] = [] # Se não mandar nada, vira lista vazia

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