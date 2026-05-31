import os
from rich.console import Console
from rich.prompt import Prompt
from backend.infra.repositorios.produto_repository import ProdutoRepository

console = Console()
repo = ProdutoRepository()

def limpar_tela():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    while True:
        limpar_tela()
        console.print("[bold gold1]☕ PAINEL DO GERENTE - CAFETERIA CAFÉ TERIA[/bold gold1]", justify="center")
        console.print("=" * 50, style="#8B5E3C")
        
        console.print("\n[bold cyan]1.[/bold cyan] Adicionar novo produto ao cardápio")
        console.print("[bold cyan]2.[/bold cyan] Ver cardápio atual")
        console.print("[bold red]0.[/bold red] Sair")
        
        opcao = Prompt.ask("\nEscolha uma opção", choices=["1", "2", "0"])
        
        if opcao == "0":
            console.print("[green]Saindo do painel...[/green]")
            break
            
        elif opcao == "1":
            console.print("\n[bold yellow]--- NOVO PRODUTO ---[/bold yellow]")
            nome = Prompt.ask("Nome do Produto (ex: Croissant)")
            preco_str = Prompt.ask("Preço (ex: 12.50)")
            categoria = Prompt.ask("Categoria", choices=["bebida", "adicional", "comida"])
            
            try:
                preco = float(preco_str.replace(",", "."))
                repo.adicionar_produto(nome, preco, categoria)
                console.print(f"\n[bold green]✅ Sucesso! '{nome}' foi adicionado ao cardápio por R$ {preco:.2f}.[/bold green]")
            except Exception as e:
                console.print(f"\n[bold red]❌ Erro ao salvar:[/bold red] {e}")
                
            Prompt.ask("\nPressione ENTER para continuar")
            
        elif opcao == "2":
            console.print("\n[bold yellow]--- CARDÁPIO ATUAL ---[/bold yellow]")
            try:
                produtos = repo.listar_produtos()
                for p in produtos:
                    console.print(f"- [cyan]{p['nome'].title()}[/cyan] | {p['categoria']} | [green]R$ {p['preco']}[/green]")
            except Exception as e:
                console.print(f"\n[bold red]❌ Erro ao buscar:[/bold red] {e}")
                
            Prompt.ask("\nPressione ENTER para continuar")

if __name__ == "__main__":
    main()