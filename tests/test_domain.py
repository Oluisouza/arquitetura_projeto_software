import unittest
from backend.domain.itens.bebidas import ItemDinamico
from backend.domain.decorators.adicionais import DecoradorDinamico
from backend.domain.fechamento_conta.strategy import (
    FechamentoPix,
    FechamentoCartao,
    FechamentoDinheiro
)


class TestDecoradorDinamico(unittest.TestCase):

    def setUp(self):
        """Cria um item base reutilizado em todos os testes desta classe."""
        self.espresso = ItemDinamico("espresso", 5.00)

    def test_item_base_nome_e_preco(self):
        """Garante que o ItemDinamico retorna os valores corretos sem decoradores."""
        self.assertEqual(self.espresso.get_nome(), "Espresso")
        self.assertEqual(self.espresso.get_preco(), 5.00)

    def test_um_adicional_soma_preco(self):
        """Decorator com um adicional deve somar o preço corretamente."""
        com_leite = DecoradorDinamico(self.espresso, "leite", 2.00)
        self.assertEqual(com_leite.get_preco(), 7.00)

    def test_um_adicional_compoe_nome(self):
        """Decorator com um adicional deve compor o nome corretamente."""
        com_leite = DecoradorDinamico(self.espresso, "leite", 2.00)
        self.assertIn("Espresso", com_leite.get_nome())
        self.assertIn("leite", com_leite.get_nome().lower())

    def test_dois_adicionais_empilhados_somam_preco(self):
        """Dois decoradores empilhados devem acumular os preços."""
        com_leite = DecoradorDinamico(self.espresso, "leite", 2.00)
        com_chantilly = DecoradorDinamico(com_leite, "chantilly", 3.50)
        self.assertEqual(com_chantilly.get_preco(), 10.50)

    def test_dois_adicionais_empilhados_compoe_nome(self):
        """Dois decoradores empilhados devem manter o nome composto completo."""
        com_leite = DecoradorDinamico(self.espresso, "leite", 2.00)
        com_chantilly = DecoradorDinamico(com_leite, "chantilly", 3.50)
        nome = com_chantilly.get_nome().lower()
        self.assertIn("espresso", nome)
        self.assertIn("leite", nome)
        self.assertIn("chantilly", nome)


class TestEstrategiasFechamento(unittest.TestCase):

    def test_pix_menciona_pix_e_valor(self):
        estrategia = FechamentoPix()
        resultado = estrategia.finalizar_conta(14.00)
        self.assertIn("PIX", resultado.upper())
        self.assertIn("14.00", resultado)

    def test_cartao_menciona_cartao_e_valor(self):
        estrategia = FechamentoCartao()
        resultado = estrategia.finalizar_conta(22.50)
        self.assertIn("CART", resultado.upper())
        self.assertIn("22.50", resultado)

    def test_dinheiro_menciona_dinheiro_e_valor(self):
        estrategia = FechamentoDinheiro()
        resultado = estrategia.finalizar_conta(8.00)
        self.assertIn("DINHEIRO", resultado.upper())
        self.assertIn("8.00", resultado)

    def test_estrategias_sao_intercambiaveis(self):
        """
        Verifica o princípio do Strategy: todas as estratégias respondem
        ao mesmo método finalizar_conta() sem o chamador precisar saber qual é qual.
        """
        valor = 30.00
        estrategias = [FechamentoPix(), FechamentoCartao(), FechamentoDinheiro()]
        for estrategia in estrategias:
            resultado = estrategia.finalizar_conta(valor)
            self.assertIsInstance(resultado, str)
            self.assertIn("30.00", resultado)


if __name__ == '__main__':
    unittest.main()