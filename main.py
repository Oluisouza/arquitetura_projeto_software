import time # Para simular o tempo de preparo
from factories.item_factory import ItemFactory
from decorators.adicionais import Leite, Chantilly
from pagamentos.strategy import PagamentoPix
from observers.observer import GerenciadorPreparo, PainelCliente

def main():
    print("=" * 50)
    print("☕ BEM-VINDO AO SISTEMA DA CAFETERIA ☕")
    print("=" * 50)
    
    # --- 1. FACTORY: Criação base ---
    pedido = ItemFactory.criar_item("cappuccino")
    
    # --- 2. DECORATOR: Personalização ---
    pedido = Leite(pedido)
    pedido = Chantilly(pedido)
    
    total = pedido.get_preco()
    nome_pedido = pedido.get_nome()
    
    print(f"\n📝 RESUMO DO PEDIDO: {nome_pedido}")
    print(f"💰 TOTAL A PAGAR: R${total:.2f}")

    # --- 3. STRATEGY: Pagamento ---
    print("\n💳 Processando pagamento...")
    # Fixamos o PIX aqui para simplificar o fluxo final
    estrategia_pagamento = PagamentoPix()
    resultado_pagamento = estrategia_pagamento.processar_pagamento(total)
    print(resultado_pagamento)

    # --- 4. OBSERVER: Preparo e Notificação ---
    print("\n👨‍🍳 Enviando pedido para o barista...\n")
    
    # Cria o gerenciador e os observadores
    gerenciador = GerenciadorPreparo()
    painel_loja = PainelCliente()
    
    
    # Inscreve o painel e o app para receberem notificações
    gerenciador.inscrever(painel_loja)

    
    # Simulando o tempo passando na vida real
    time.sleep(1)
    gerenciador.set_status(f"Em preparo ({nome_pedido})")
    
    time.sleep(2)
    gerenciador.set_status("PRONTO PARA RETIRADA na bancada!")
    
    print("\n" + "=" * 50)
    print("✅ FLUXO CONCLUÍDO COM SUCESSO!")
    print("=" * 50)

if __name__ == "__main__":
    main()