# ☕ Café Teria — Sistema de PDV

Sistema de Ponto de Venda (PDV) para cafeteria, desenvolvido como trabalho final
da disciplina de Arquitetura e Projeto de Software.

O projeto demonstra na prática a aplicação de **Clean Architecture**, princípios
**SOLID** e cinco padrões de projeto **GoF**, integrados em um sistema funcional
com frontend React, backend FastAPI e banco de dados PostgreSQL na nuvem.

---

## 🏗️ Arquitetura
cafeteria_patterns/
├── backend/
│   ├── api/              # Camada de Apresentação (FastAPI + Pydantic)
│   ├── use_cases/        # Camada de Aplicação (orquestração das regras)
│   ├── domain/           # Núcleo — entidades e padrões GoF
│   │   ├── itens/        # Entidade base e ItemDinamico
│   │   ├── decorators/   # Padrão Decorator (adicionais e tamanhos)
│   │   ├── factories/    # Padrão Factory (instanciação data-driven)
│   │   ├── fechamento_conta/ # Padrão Strategy (formas de pagamento)
│   │   ├── pedido/       # Padrão Command (carrinho com undo)
│   │   ├── cozinha/      # Padrão Singleton (fila única)
│   │   ├── observers/    # Padrão Observer (status do pedido)
│   │   └── interfaces/   # Contratos abstratos (DIP)
│   └── infra/            # Detalhes externos (Supabase, repositórios)
├── frontend/             # SPA React + Vite + Tailwind CSS v4
├── tests/                # Testes unitários (pytest/unittest)
├── features/             # Testes de comportamento BDD (Gherkin/behave)
├── admin.py              # CLI do gerente (rich)
├── main.py               # CLI de demonstração dos padrões
└── Dockerfile            # Containerização do backend

---

## 🎯 Padrões de Projeto Aplicados

### Factory Method — `backend/domain/factories/item_factory.py`
Instancia produtos dinamicamente a partir do banco de dados. Novos produtos
são adicionados pelo gerente via `admin.py` sem nenhuma alteração no código
— respeita o princípio **Open/Closed (OCP)**.

### Decorator — `backend/domain/decorators/adicionais.py`
Envolve um item com adicionais (leite, chantilly) e tamanhos (médio, grande)
de forma recursiva e em tempo de execução. Elimina a explosão de subclasses
que ocorreria com herança.

### Command — `backend/domain/pedido/carrinho.py`
Encapsula cada ação do carrinho como um objeto com `executar()` e `desfazer()`.
Habilita o histórico de ações e o comportamento de desfazer itens inseridos
erroneamente.

### Strategy — `backend/domain/fechamento_conta/strategy.py`
Cada forma de pagamento (Pix, Cartão, Dinheiro) é uma estratégia intercambiável
que sabe processar a si mesma. Elimina blocos `if/else` no controlador e
permite adicionar novos métodos de pagamento sem alterar o código existente.

### Singleton — `backend/domain/cozinha/fila_pedidos.py`
Garante que existe apenas uma fila de pedidos na memória da aplicação.
Múltiplos atendentes alimentam a mesma fila centralizada acessada pela cozinha.

### Observer — `backend/domain/observers/observer.py`
Define o contrato para notificação de mudanças de status do pedido.
`GerenciadorPreparo` notifica todos os observadores inscritos ao mudar o status.

---

## ⚙️ Como rodar localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Backend

```bash
# 1. Crie e ative o ambiente virtual
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Linux/Mac

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz com:
# SUPABASE_URL=sua_url_aqui
# SUPABASE_KEY=sua_chave_aqui

# 4. Suba o servidor
uvicorn backend.api.rotas:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Painel do gerente (CLI)

```bash
python admin.py
```

---

## 🧪 Testes

```bash
# Todos os testes unitários
pytest -v

# Apenas um módulo
pytest tests/test_domain.py -v
pytest tests/test_cozinha.py -v

# Testes de comportamento BDD
behave features/pedido.feature
```

**Cobertura atual: 17 testes unitários + 1 cenário BDD**

| Arquivo | Testes | O que cobre |
|---|---|---|
| `test_domain.py` | 9 | Decorator (nome, preço, empilhamento) + Strategy (3 métodos + intercambialidade) |
| `test_cozinha.py` | 6 | Singleton (instância única) + Fila FIFO (ordem, remoção, fila vazia) |
| `test_api.py` | 2 | Rota `/pedidos/pagar` (PIX + envio para cozinha) |
| `pedido.feature` | 1 | Montagem de pedido com adicional via BDD |

---

## 🚀 Deploy

O backend está publicado no **Render.com** com deploy automático a cada push
na branch `main`. As variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_KEY`,
`FRONTEND_URL`) são configuradas no painel do Render.

---

## 🏛️ Decisões arquiteturais relevantes

**Por que Clean Architecture?**
Isola as regras de negócio (domínio) de detalhes de implementação (FastAPI,
Supabase). O domínio não importa nada de `infra/` — a dependência flui sempre
de fora para dentro.

**Por que o Factory é data-driven?**
Em vez de uma classe por produto, o `ItemFactory` consulta o banco e instancia
um `ItemDinamico` em tempo de execução. O gerente cadastra novos produtos via
`admin.py` sem o programador precisar alterar uma linha de código.

**Por que Decorator para tamanhos?**
Tamanho é um adicional de preço como qualquer outro. Tratar como Decorator
elimina a necessidade de classes como `CappuccinoGrande` ou
`EspressoMedioComLeite` — a combinação acontece em runtime.

**Limitação conhecida do Singleton em produção:**
A `FilaDePedidosDaCozinha` garante instância única dentro de um processo Python.
Com múltiplos workers, cada processo teria sua própria fila. O servidor está
configurado com um único worker (`--workers 1`) até que a fila seja migrada
para persistência no banco.