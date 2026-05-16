from abc import ABC, abstractmethod

class EstrategiaPagamento(ABC):
    """
    Padrão Strategy.
    Define um contrato para as diferentes formas de pagamento.
    """

    @abstractmethod
    def processar_pagamento(self, valor: float) -> str:
        pass

class PagamentoPix(EstrategiaPagamento):
    def processar_pagamento(self, valor: float) -> str:
        return f"Pagamento de R${valor:.2f} via PIX - QR Code gerado."
    
class PagamentoCartao(EstrategiaPagamento):
    def processar_pagamento(self, valor: float) -> str:
        return f"Pagamento de R${valor:.2f} via Cartão - Operadora notificada."