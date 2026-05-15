from factories.item_factory import ItemFactory

def main():
    print("--- Sistema de Cafeteria Iniciado ---")

    cafe1 = ItemFactory.criar_item("Espresso")
    cafe2 = ItemFactory.criar_item("Cappuccino")

    print(f"Item: {cafe1.get_nome()} - Preço: R${cafe1.get_preco():.2f}")
    print(f"Item: {cafe2.get_nome()} - Preço: R${cafe2.get_preco():.2f}")

if __name__ == "__main__":
    main()