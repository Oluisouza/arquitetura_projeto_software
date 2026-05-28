import os
import time
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.text import Text
from rich import print as rprint

# Importando nossos padrões de projeto
from backend.domain.factories.item_factory import ItemFactory
from backend.domain.decorators.adicionais import Leite, Chantilly
from backend.domain.fechamento_conta.strategy import PagamentoPix, PagamentoCartao
from backend.domain.observers.observer import GerenciadorPreparo, PainelCliente

# Inicializando o console do Rich para cores e painéis
console = Console()

def limpar_tela():
    os.system('cls' if os.name == 'nt' else 'clear')

def exibir_cabecalho():
    limpar_tela()
    titulo = Text("☕ CAFETERIA CAFÉ TERIA ☕\n", justify="center", style="bold cyan")
    titulo.append("Sistema Arquitetural de Pedidos", style="italic white")
    console.print(Panel(titulo, border_style="cyan", padding=(1, 2)))
    print()

def main():
    # ==========================================
    # ETAPA 1: ESCOLHER A BEBIDA (FACTORY)
    # ==========================================
    pedido = None
    while True:
        exibir_cabecalho()
        console.print("[bold yellow]▶ ESCOLHA SUA BEBIDA BASE:[/bold yellow]")
        console.print("  [cyan][1][/cyan] Café Espresso ([green]R$ 5.00[/green])")
        console.print("  [cyan][2][/cyan] Cappuccino Tradicional ([green]R$ 8.50[/green])")
        
        # Usando o Prompt do Rich que já formata e valida a entrada
        opcao = Prompt.ask("\n[bold white]Digite o número da opção desejada[/bold white]", choices=["1", "2"])
        
        if opcao == "1":
            pedido = ItemFactory.criar_item("espresso")
            break
        elif opcao == "2":
            pedido = ItemFactory.criar_item("cappuccino")
            break

    # ==========================================
    # ETAPA 2: ESCOLHER ADICIONAIS (DECORATOR)
    # ==========================================
    while True:
        exibir_cabecalho()
        
        # Painel flutuante mostrando o pedido atual
        resumo_atual = f"[bold]Item:[/bold] {pedido.get_nome()}\n[bold]Valor Atual:[/bold] [green]R$ {pedido.get_preco():.2f}[/green]"
        console.print(Panel(resumo_atual, title="🛒 Carrinho", border_style="yellow", width=60))
        
        console.print("\n[bold yellow]▶ DESEJA INCLUIR ADICIONAIS?[/bold yellow]")
        console.print("  [cyan][1][/cyan] + Leite ([green]R$ 2.00[/green])")
        console.print("  [cyan][2][/cyan] + Chantilly ([green]R$ 3.50[/green])")
        console.print("  [red][0][/red] ➡ FINALIZAR PEDIDO")
        
        opcao = Prompt.ask("\n[bold white]Digite a opção[/bold white]", choices=["1", "2", "0"])
        
        if opcao == "1":
            pedido = Leite(pedido)
            console.print("[bold green]✅ Leite adicionado![/bold green]")
            time.sleep(0.5)
        elif opcao == "2":
            pedido = Chantilly(pedido)
            console.print("[bold green]✅ Chantilly adicionado![/bold green]")
            time.sleep(0.5)
        elif opcao == "0":
            break

    total = pedido.get_preco()

    # ==========================================
    # ETAPA 3: PAGAMENTO (STRATEGY)
    # ==========================================
    estrategia_pagamento = None
    while True:
        exibir_cabecalho()
        
        recibo = f"[bold]Pedido final:[/bold] {pedido.get_nome()}\n[bold]Total a Pagar:[/bold] [green]R$ {total:.2f}[/green]"
        console.print(Panel(recibo, title="🧾 Recibo", border_style="green", width=60))
        
        console.print("\n[bold yellow]▶ ESCOLHA A FORMA DE PAGAMENTO:[/bold yellow]")
        console.print("  [cyan][1][/cyan] PIX (Aprovação imediata)")
        console.print("  [cyan][2][/cyan] Cartão de Crédito")
        
        opcao = Prompt.ask("\n[bold white]Digite a forma de pagamento[/bold white]", choices=["1", "2"])
        
        if opcao == "1":
            estrategia_pagamento = PagamentoPix()
            break
        elif opcao == "2":
            estrategia_pagamento = PagamentoCartao()
            break

    exibir_cabecalho()
    with console.status("[bold yellow]Processando pagamento com o banco...[/bold yellow]", spinner="dots"):
        time.sleep(2) # Simula o tempo de transação
    
    resultado_pagamento = estrategia_pagamento.processar_pagamento(total)
    console.print(f"\n[bold green]✅ {resultado_pagamento}[/bold green]")
    time.sleep(2)

    # ==========================================
    # ETAPA 4: PREPARO E NOTIFICAÇÃO (OBSERVER)
    # ==========================================
    exibir_cabecalho()
    console.print(Panel("[bold cyan]👨‍🍳 Pedido enviado para o Barista!\nAcompanhe o status pelo painel abaixo...[/bold cyan]", border_style="blue"))
    print("\n")
    
    gerenciador = GerenciadorPreparo()
    painel_loja = PainelCliente()
    gerenciador.inscrever(painel_loja)
    
    # Simulação do preparo com animações de carregamento do Rich
    with console.status("[bold yellow]Iniciando preparo...[/bold yellow]", spinner="bouncingBar"):
        time.sleep(1)
        gerenciador.set_status("Em preparo... ☕")
        
        time.sleep(2)
        gerenciador.set_status("Finalizando detalhes... ✨")
        
        time.sleep(2)
        gerenciador.set_status(f"[bold green]PRONTO! Pode retirar seu {pedido.get_nome()}! 🎉[/bold green]")
    
    print("\n")
    console.print(Panel("[bold white]✅ OBRIGADO POR COMPRAR NA CAFETERIA CAFÉ TERIA![/bold white]", style="on green"))
    print("\n")

if __name__ == "__main__":
    main()