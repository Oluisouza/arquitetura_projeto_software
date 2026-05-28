# backend/domain/fechamento_conta/strategy.py
from abc import ABC, abstractmethod

class EstrategiaFechamento(ABC):
    """
    Padrão Comportamental: Strategy.
    Define a ação do sistema do Atendente (PDV) ao fechar uma conta.
    """
    @abstractmethod
    def finalizar_conta(self, valor_total: float) -> str:
        pass

class FechamentoDinheiro(EstrategiaFechamento):
    """Atendente deve calcular troco na gaveta"""
    def finalizar_conta(self, valor_total: float) -> str:
        return f"Conta de R${valor_total:.2f} fechada em DINHEIRO. (Abra a gaveta do caixa)"

class FechamentoPix(EstrategiaFechamento):
    """atendente  apenas registra e mostra QR code no monitor da maquininha física"""
    def finalizar_conta(self, valor_total: float) -> str:
        return f"Conta de R${valor_total:.2f} fechada via PIX. (Exiba QR Code no monitor da maquininha física do balcão)"
    
class FechamentoCartao(EstrategiaFechamento):
    """Atendente apenas registra e usa a maquininha física"""
    def finalizar_conta(self, valor_total: float) -> str:
        return f"Conta de R${valor_total:.2f} fechada no CARTÃO. (Passe na maquininha física do balcão)"