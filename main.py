import os
import time
from factories.item_factory import ItemFactory
from decorators.adicionais import Leite, Chantilly
from pagamentos.strategy import PagamentoPix, PagamentoCartao
from observers.observer import GerenciadorPreparo, PainelCliente

def limpar_tela():
    """Função auxiliar para limpar o terminal e deixar o visual limpo"""
    os.system('cls' if os.name == 'nt' else 'clear')

def exibir_cabecalho():
    limpar_tela()
    print("╔══════════════════════════════════════════════╗")
    print("║          ☕ CAFETERIA PATTERNS ☕            ║")
    print("╚══════════════════════════════════════════════╝\n")

def main():
    # ==========================================
    # ETAPA 1: ESCOLHER A BEBIDA (FACTORY)
    # ==========================================
    pedido = None
    while True:
        exibir_cabecalho()
        print("▶ ESCOLHA SUA BEBIDA BASE:")
        print("  [1] Café Espresso (R$ 5.00)")
        print("  [2] Cappuccino Tradicional (R$ 8.50)")
        
        opcao = input("\nDigite o número da opção desejada: ")
        
        if opcao == "1":
            pedido = ItemFactory.criar_item("espresso")
            break
        elif opcao == "2":
            pedido = ItemFactory.criar_item("cappuccino")
            break
        else:
            print("❌ Opção inválida! Tente novamente.")
            time.sleep(1)

    # ==========================================
    # ETAPA 2: ESCOLHER ADICIONAIS (DECORATOR)
    # ==========================================
    while True:
        exibir_cabecalho()
        print(f"🛒 PEDIDO ATUAL: {pedido.get_nome()} | R$ {pedido.get_preco():.2f}\n")
        print("▶ DESEJA INCLUIR ADICIONAIS?")
        print("  [1] + Leite (R$ 2.00)")
        print("  [2] + Chantilly (R$ 3.50)")
        print("  [0] ➡ FINALIZAR PEDIDO")
        
        opcao = input("\nDigite o número da opção desejada: ")
        
        if opcao == "1":
            pedido = Leite(pedido) # Decora com leite
            print("✅ Leite adicionado!")
            time.sleep(0.5)
        elif opcao == "2":
            pedido = Chantilly(pedido) # Decora com chantilly
            print("✅ Chantilly adicionado!")
            time.sleep(0.5)
        elif opcao == "0":
            break
        else:
            print("❌ Opção inválida! Tente novamente.")
            time.sleep(1)

    total = pedido.get_preco()

    # ==========================================
    # ETAPA 3: PAGAMENTO (STRATEGY)
    # ==========================================
    estrategia_pagamento = None
    while True:
        exibir_cabecalho()
        print("🧾 RESUMO DO PEDIDO")
        print(f"Item: {pedido.get_nome()}")
        print(f"Total a Pagar: R$ {total:.2f}")
        print("------------------------------------------------")
        print("▶ ESCOLHA A FORMA DE PAGAMENTO:")
        print("  [1] PIX (Aprovação imediata)")
        print("  [2] Cartão de Crédito")
        
        opcao = input("\nDigite a forma de pagamento: ")
        
        if opcao == "1":
            estrategia_pagamento = PagamentoPix()
            break
        elif opcao == "2":
            estrategia_pagamento = PagamentoCartao()
            break
        else:
            print("❌ Opção inválida! Tente novamente.")
            time.sleep(1)

    # Processa o pagamento de fato
    exibir_cabecalho()
    print("⏳ Processando pagamento...")
    time.sleep(2)
    print(f"\n{estrategia_pagamento.processar_pagamento(total)}")
    time.sleep(2)

    # ==========================================
    # ETAPA 4: PREPARO E NOTIFICAÇÃO (OBSERVER)
    # ==========================================
    exibir_cabecalho()
    print("👨‍🍳 Pedido enviado para o Barista!")
    print("Acompanhe o status pelo painel...\n")
    print("------------------------------------------------")
    
    # Configurando os Observadores
    gerenciador = GerenciadorPreparo()
    painel_loja = PainelCliente()
    
    gerenciador.inscrever(painel_loja)
    
    # Simulando o preparo do café
    time.sleep(1)
    gerenciador.set_status("Em preparo... ☕")
    
    time.sleep(3) # Espera 3 segundos
    gerenciador.set_status("Finalizando detalhes... ✨")
    
    time.sleep(2) # Espera 2 segundos
    gerenciador.set_status(f"PRONTO! Pode retirar seu {pedido.get_nome()}! 🎉")
    
    print("------------------------------------------------")
    print("\n✅ OBRIGADO POR COMPRAR NA CAFETERIA PATTERNS!")
    print("\n")

if __name__ == "__main__":
    main()