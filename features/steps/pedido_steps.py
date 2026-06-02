from behave import given, when, then
from backend.domain.pedido.carrinho import PedidoCliente, ComandoAdicionarItem
from backend.domain.factories.item_factory import ItemFactory
from backend.domain.decorators.adicionais import DecoradorDinamico

ADICIONAIS_TESTE = {
    "chantilly": 3.50,
    "leite": 2.00,
    "mel": 1.50,
}

@given('que o atendente iniciou um pedido para o cliente "{nome_cliente}"')
def step_iniciar_pedido(context, nome_cliente):
    context.pedido = PedidoCliente(nome_cliente)

@when('ele monta um "{bebida_base}"')
def step_montar_bebida(context, bebida_base):
    context.item_atual = ItemFactory.criar_item(bebida_base)

@when('adiciona a cobertura de "{adicional}"')
def step_adicionar_cobertura(context, adicional):
    preco = ADICIONAIS_TESTE.get(adicional.lower(), 1.00)
    context.item_atual = DecoradorDinamico(context.item_atual, adicional, preco)

@when('confirma a inclusao do item no carrinho')
def step_confirmar_item(context):
    comando = ComandoAdicionarItem(context.pedido, context.item_atual)
    context.pedido.registrar_e_executar_comando(comando)

@then('o valor total do pedido deve ser {valor_esperado:f}')
def step_verificar_total(context, valor_esperado):
    total_calculado = context.pedido.calcular_total()
    assert total_calculado == float(valor_esperado), \
        f"Esperado {valor_esperado}, mas calculou {total_calculado}"