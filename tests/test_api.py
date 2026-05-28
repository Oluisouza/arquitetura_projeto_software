from fastapi.testclient import TestClient
from backend.api.rotas import app

cliente = TestClient(app)

def test_fechar_conta_com_pix_deve_retornar_sucesso():
    """
    TDD - Fase RED: Testando uma rota que AINDA NÃO EXISTE.
    O objetivo é garantir que a API processe o pagamento via PIX e devolva status 200.
    """
    payload = {
        "valor_total": 14.00,
        "metodo_pagamento": "pix"
    }
    
    resposta = cliente.post("/pedidos/pagar", json=payload)
    
    assert resposta.status_code == 200 
    assert "QR Code" in resposta.json()["mensagem"] 