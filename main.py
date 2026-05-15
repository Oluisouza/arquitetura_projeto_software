from factories.item_factory import ItemFactory
from decorators.adicionais import Leite, Chantilly

def main():
    print("--- Sistema de Cafeteria Iniciado ---")

#    cafe1 = ItemFactory.criar_item("Espresso")
#    cafe2 = ItemFactory.criar_item("Cappuccino")

#    print(f"Item: {cafe1.get_nome()} - Preço: R${cafe1.get_preco():.2f}")
#    print(f"Item: {cafe2.get_nome()} - Preço: R${cafe2.get_preco():.2f}")

    pedido = ItemFactory.criar_item("Espresso")
    print(f"Base: {pedido.get_nome()} - Preço: R${pedido.get_preco():.2f}")

    pedido = Leite(pedido)
    print(f"Adicionado Leite: {pedido.get_nome()} - Preço: R${pedido.get_preco():.2f}")

    pedido = Chantilly(pedido)
    print(f"Adicionado Chantilly: {pedido.get_nome()} - Preço: R${pedido.get_preco():.2f}")

    print("-" * 40)
    print(f"RESUMO DO PEDIDO: {pedido.get_nome()}")
    print(f"TOTAL A PAGAR: R${pedido.get_preco():.2f}")



if __name__ == "__main__":
    main()