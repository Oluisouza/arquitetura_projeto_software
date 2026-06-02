from backend.domain.pedido.carrinho import PedidoCliente, ComandoAdicionarItem
from backend.domain.factories.item_factory import ItemFactory
from backend.domain.decorators.adicionais import DecoradorDinamico
from backend.domain.interfaces.repositorios import IProdutoRepository
from backend.infra.repositorios.produto_repository import ProdutoRepository

class CriarPedidoUseCase:
    def __init__(self, repo: IProdutoRepository = None):
        self.repo = repo or ProdutoRepository()

    def executar(self, nome_cliente: str, itens_carrinho: list) -> dict:
        pedido = PedidoCliente(nome_cliente)
        resumo_nomes = []

        catalogo = self.repo.listar_produtos()

        for item_req in itens_carrinho:
            item = ItemFactory.criar_item_do_catalogo(item_req["bebida_base"], catalogo)

            for adicional in item_req.get("adicionais", []):
                prod_adic = next((p for p in catalogo if p["nome"] == adicional), None)
                if prod_adic:
                    item = DecoradorDinamico(item, prod_adic["nome"], prod_adic["preco"])

            comando = ComandoAdicionarItem(pedido, item)
            pedido.registrar_e_executar_comando(comando)
            resumo_nomes.append(item.get_nome())

        return {
            "cliente": pedido.nome_cliente,
            "item_preparado": " | ".join(resumo_nomes),
            "total_a_pagar": pedido.calcular_total(),
            "status": "Aguardando pagamento"
        }