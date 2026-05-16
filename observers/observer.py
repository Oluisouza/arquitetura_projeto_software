from abc import ABC, abstractmethod

class NotificadorObserver(ABC):
    """
    Padrão Observer.
    Define um contrato para os observadores que serão notificados sobre eventos.
    """

    @abstractmethod
    def atualizar(self, mensagem: str):
        pass

class PainelCliente(NotificadorObserver):
    """
    Observador concreto que representa o painel do cliente.
    """

    def atualizar(self, mensagem: str):
        print(f"[PAINEL DIGITAL] ATENÇÂO: {mensagem}")

class GerenciadorPreparo:
    """
    Padrão Observer
    Gerencia o status do pedido e notifica os inscritos.
    """

    def __init__(self):
        self._inscritos = []
        self._status = "Aguardando"

    def inscrever (self, observador: NotificadorObserver):
        self._inscritos.append(observador)

    def remover (self, observador: NotificadorObserver):
        self._inscritos.remove(observador)
    
    def notificar_todos(self):
        for inscrito in self._inscritos:
            inscrito.atualizar(f"O status do seu pedido mudou para: {self._status}")
    
    def set_status(self, novo_status: str):
        self._status = novo_status
        self.notificar_todos()