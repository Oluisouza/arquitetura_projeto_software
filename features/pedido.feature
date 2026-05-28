# language: pt

Funcionalidade: Criação de Pedido no PDV
  Como um atendente de caixa
  Eu quero montar o pedido de um cliente com bebidas e adicionais
  Para que o sistema calcule o total correto a ser cobrado

  Cenário: Atendente monta um café com adicional
    Dado que o atendente iniciou um pedido para o cliente "João"
    Quando ele monta um "cappuccino"
    E adiciona a cobertura de "chantilly"
    E confirma a inclusao do item no carrinho
    Então o valor total do pedido deve ser 12.00