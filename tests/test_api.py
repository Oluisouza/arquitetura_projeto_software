from fastapi.testclient import TestClient
from backend.api.rotas import app
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha

cliente = TestClient(app)

def test_fechar_conta_com_pix_deve_retornar_sucesso():
    """
    TDD - Fase RED: Testando uma rota que AINDA NÃO EXISTE.
    O objetivo é garantir que a API processe o pagamento via PIX e devolva status 200.
    """
    payload = {
        "valor_total": 14.00,
        "metodo_pagamento": "pix",
        "nome_cliente": "Cliente Teste"
    }
    
    resposta = cliente.post("/pedidos/pagar", json=payload)
    
    assert resposta.status_code == 200 
    assert "QR Code" in resposta.json()["mensagem"] 

def test_pagamento_envia_pedido_para_cozinha():
    """
    TDD - Fase RED: Garantir que ao pagar, o pedido vai para a Fila Única (Singleton).
    """
    fila = FilaDePedidosDaCozinha()
    fila._pedidos_pendentes.clear()

    payload = {
        "valor_total": 14.00,
        "metodo_pagamento": "pix",
        "nome_cliente": "Mesa 04" 
    }
    
    resposta = cliente.post("/pedidos/pagar", json=payload)
    
    assert resposta.status_code == 200
    
    pendentes = fila.listar_pendentes()
    assert len(pendentes) == 1
    assert pendentes[0] == "Mesa 04"