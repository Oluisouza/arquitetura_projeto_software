class FilaDePedidosDaCozinha:
    _instancia = None 

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super(FilaDePedidosDaCozinha, cls).__new__(cls)
            cls._instancia._pedidos_pendentes = []
            cls._instancia._pedidos_prontos = []
        return cls._instancia