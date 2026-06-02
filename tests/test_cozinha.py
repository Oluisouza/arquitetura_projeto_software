import unittest
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha
from backend.domain.pedido.carrinho import PedidoCliente


class TestFilaCozinha(unittest.TestCase):

    def setUp(self):
        """Garante fila limpa antes de cada teste."""
        self.fila = FilaDePedidosDaCozinha()
        self.fila._pedidos_pendentes.clear()
        self.fila._pedidos_prontos.clear()

    def test_singleton_garante_instancia_unica(self):
        """Duas chamadas devem retornar exatamente o mesmo objeto na memória."""
        fila_atendente_1 = FilaDePedidosDaCozinha()
        fila_atendente_2 = FilaDePedidosDaCozinha()
        self.assertIs(fila_atendente_1, fila_atendente_2)

    def test_pedido_recebido_aparece_nos_pendentes(self):
        """Ao receber um pedido, ele deve aparecer na lista de pendentes."""
        self.fila.receber_pedido(PedidoCliente("Maria"))
        self.assertEqual(len(self.fila.listar_pendentes()), 1)
        self.assertIn("Maria", self.fila.listar_pendentes())

    def test_ordem_fifo_dois_pedidos(self):
        """O primeiro pedido a entrar deve ser o primeiro a sair (FIFO)."""
        self.fila.receber_pedido(PedidoCliente("Cliente A"))
        self.fila.receber_pedido(PedidoCliente("Cliente B"))
        primeiro = self.fila.marchar_proximo_pedido()
        self.assertEqual(primeiro.nome_cliente, "Cliente A")

    def test_pedido_marchado_sai_dos_pendentes(self):
        """Após marchar um pedido, ele não deve mais aparecer nos pendentes."""
        self.fila.receber_pedido(PedidoCliente("João"))
        self.fila.marchar_proximo_pedido()
        self.assertEqual(len(self.fila.listar_pendentes()), 0)

    def test_fila_vazia_retorna_none(self):
        """Marchar em fila vazia não deve quebrar — deve retornar None."""
        resultado = self.fila.marchar_proximo_pedido()
        self.assertIsNone(resultado)

    def test_multiplos_pedidos_ordem_preservada(self):
        """Com três pedidos, a ordem de saída deve respeitar a entrada."""
        nomes = ["Ana", "Bruno", "Carla"]
        for nome in nomes:
            self.fila.receber_pedido(PedidoCliente(nome))

        for nome_esperado in nomes:
            pedido = self.fila.marchar_proximo_pedido()
            self.assertEqual(pedido.nome_cliente, nome_esperado)


if __name__ == '__main__':
    unittest.main()