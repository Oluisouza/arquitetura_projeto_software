import unittest
from backend.domain.cozinha.fila_pedidos import FilaDePedidosDaCozinha

class TestFilaCozinha(unittest.TestCase):
    
    def test_singleton_garante_instancia_unica(self):
        """Testa se duas chamadas para a fila retornam o mesmo espaço de memória"""
        # Atendente 1 acessa a fila
        fila_atendente_1 = FilaDePedidosDaCozinha()
        
        # Atendente 2 acessa a fila
        fila_atendente_2 = FilaDePedidosDaCozinha()
        
        # O teste VERIFICA se as duas são exatamente o mesmo objeto
        self.assertIs(fila_atendente_1, fila_atendente_2)

if __name__ == '__main__':
    unittest.main()