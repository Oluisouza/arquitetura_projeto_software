from backend.domain.pedido.carrinho import PedidoCliente, ComandoAdicionarItem
from backend.domain.factories.item_factory import ItemFactory
from backend.domain.decorators.adicionais import Leite, Chantilly

class CriarPedidoUseCase:
    """
    Caso de Uso: Intermediário entre a API e Domínio.
    Recebe dados puros (strings, listas) e orquestra os Padrões de Projeto.
    """
    
    def executar(self, nome_cliente: str, bebida_base: str, adicionais: list[str]) -> dict:
        pedido = PedidoCliente(nome_cliente)
        
        item = ItemFactory.criar_item(bebida_base)
        
        for adicional in adicionais:
            if adicional.lower() == "leite":
                item = Leite(item)
            elif adicional.lower() == "chantilly":
                item = Chantilly(item)
                
        comando = ComandoAdicionarItem(pedido, item)
        pedido.registrar_e_executar_comando(comando)
        
        return {
            "cliente": pedido.nome_cliente,
            "item_preparado": item.get_nome(),
            "total_a_pagar": pedido.calcular_total(),
            "status": "Aguardando pagamento"
        }