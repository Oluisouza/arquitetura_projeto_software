# ☕ Café Teria — Sistema de PDV

Sistema de Ponto de Venda (PDV) e gerenciamento de pedidos para cafeteria, desenvolvido como trabalho final da disciplina de **Arquitetura e Projeto de Software**.

O projeto demonstra na prática a aplicação de **Clean Architecture**, princípios **SOLID** e seis padrões de projeto **GoF**, integrados em um sistema funcional completo com três telas, comunicação em tempo real via SSE e deploy em produção.

**[🚀 Acessar o sistema em produção](https://pdv-cafeteria-cafe-teria.onrender.com)**

---

## 🖥️ Telas do sistema

| Tela | Rota | Descrição |
|------|------|-----------|
| PDV | `/` | Painel do atendente — monta pedidos e registra pagamentos |
| Cozinha | `/cozinha` | Kitchen Display System — kanban de preparo em tempo real |
| Admin | `/admin` | Painel do gerente — gestão de produtos e cardápio |

---

## 🏗️ Arquitetura

O backend segue **Clean Architecture** com separação estrita de camadas:

```
cafeteria_patterns/
├── backend/
│   ├── api/              # Apresentação — FastAPI + Pydantic
│   ├── use_cases/        # Aplicação — orquestração de regras
│   ├── domain/           # Núcleo — entidades e padrões GoF
│   │   ├── itens/        # ItemCafeteria + ItemDinamico
│   │   ├── decorators/   # DecoradorDinamico (Decorator)
│   │   ├── factories/    # ItemFactory data-driven (Factory)
│   │   ├── fechamento_conta/ # FechamentoPix/Cartao/Dinheiro (Strategy)
│   │   ├── pedido/       # ComandoAdicionarItem + undo (Command)
│   │   ├── cozinha/      # FilaDePedidosDaCozinha (Singleton)
│   │   ├── observers/    # NotificadorObserver (Observer)
│   │   └── interfaces/   # IProdutoRepository — DIP
│   └── infra/            # Detalhes externos — Supabase, SSE, repositórios
├── frontend/
│   └── src/
│       ├── pages/        # PDV.jsx · Cozinha.jsx · Admin.jsx
│       ├── components/   # ProdutoCard.jsx
│       └── index.css     # Design system com variáveis CSS
├── tests/                # Testes unitários (pytest/unittest)
├── features/             # Testes de comportamento BDD (Gherkin/behave)
└── admin.py              # CLI do gerente (Rich)
```

---

## 🎯 Padrões de projeto (GoF)

### Factory Method — `backend/domain/factories/item_factory.py`
Instancia produtos **dinamicamente a partir do banco de dados**. Novos produtos são cadastrados pelo gerente sem alterar nenhuma linha de código — respeita o princípio **Open/Closed (OCP)**.

### Decorator — `backend/domain/decorators/adicionais.py`
Envolve um item com adicionais (leite, chantilly) e tamanhos (médio, grande) de forma **recursiva em tempo de execução**. Elimina a explosão de subclasses que ocorreria com herança (`CappuccinoGrandeComLeite`, etc).

### Command — `backend/domain/pedido/carrinho.py`
Encapsula cada ação do carrinho como um objeto com `executar()` e `desfazer()`. Habilita **histórico de ações** e comportamento de desfazer itens inseridos erroneamente.

### Strategy — `backend/domain/fechamento_conta/strategy.py`
Cada forma de pagamento sabe processar a si mesma. Elimina blocos `if/else` e permite adicionar novos métodos de pagamento sem alterar o código existente.

### Singleton — `backend/domain/cozinha/fila_pedidos.py`
Garante **uma única fila de pedidos** na memória da aplicação. Múltiplos atendentes alimentam a mesma fila centralizada acessada pela cozinha.

### Observer — `backend/infra/sse_manager.py`
Implementado via **Server-Sent Events (SSE)**. Quando um pedido muda de status, o `SSEManager` notifica todos os browsers conectados instantaneamente — sem polling, sem delay.

```
Cozinha clica "Pronto"
    → PATCH /pedidos/{id}/status
        → banco atualizado
            → SSEManager.emitir("status_atualizado")
                → PDV recebe notificação em tempo real
```

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Banco de dados | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Tempo real | Server-Sent Events (SSE) |
| Deploy | Render.com (CI/CD automático) |
| Testes | pytest + unittest + behave (BDD) |

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
# FRONTEND_URL=http://localhost:5173

# 4. Suba o servidor
uvicorn backend.api.rotas:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### CLI do gerente

```bash
python admin.py
```

---

## 🧪 Testes

```bash
# Todos os testes unitários
pytest -v

# Módulos individuais
pytest tests/test_domain.py -v    # Decorator + Strategy
pytest tests/test_cozinha.py -v   # Singleton + FIFO
pytest tests/test_api.py -v       # Rotas da API

# Testes de comportamento BDD
behave features/pedido.feature
```

### Cobertura atual: 17 testes + 1 cenário BDD

| Arquivo | Testes | Cobre |
|---------|--------|-------|
| `test_domain.py` | 9 | Decorator (preço, nome, empilhamento) + Strategy (3 métodos + intercambialidade) |
| `test_cozinha.py` | 6 | Singleton (instância única) + Fila FIFO (ordem, remoção, fila vazia) |
| `test_api.py` | 2 | Rota `/pedidos/pagar` |
| `pedido.feature` | 1 | Montagem de pedido com adicional via BDD |

---

## 🔄 Fluxo do pedido

```
1. Atendente monta o carrinho (Command)
2. Confirma pedido → backend calcula via Factory + Decorator
3. Atendente coleta pagamento fisicamente no balcão
4. Registra forma de pagamento (Strategy) → salva no Supabase + Singleton
5. SSE emite "pedido_novo" → Cozinha recebe instantaneamente
6. Cozinha: Na fila → Em preparo → Pronto (SSE a cada mudança)
7. PDV exibe notificação "PEDIDO DE X ESTÁ PRONTO" (Observer)
8. Atendente confirma entrega → status "Entregue"
```

> **O sistema não processa pagamentos financeiros.** Os botões PIX/Cartão/Dinheiro
> registram apenas a forma de entrada para fins de auditoria.

---

## 🏛️ Decisões arquiteturais relevantes

**Por que Factory data-driven?**
Novos produtos são cadastrados no banco via painel Admin sem o programador precisar alterar uma linha de código. O `ItemFactory` consulta o banco e instancia `ItemDinamico` em runtime.

**Por que Decorator para tamanhos?**
Tamanho é um adicional de preço como qualquer outro. Tratar como Decorator elimina classes como `CappuccinoGrande` — a combinação acontece em runtime.

**Por que SSE em vez de WebSocket?**
SSE é unidirecional (servidor → cliente), mais simples de implementar com FastAPI e suficiente para o caso de uso. O cliente já faz requisições HTTP normais para enviar dados.

**Por que upload via backend?**
O SDK `@supabase/supabase-js` causa erros de build no Vite em produção. O upload é feito via `POST /produtos/upload-imagem` no Python, que usa o cliente Supabase já configurado.

**Limitação conhecida do Singleton:**
`FilaDePedidosDaCozinha` não escala com múltiplos workers — cada processo teria sua própria fila. O servidor usa `--workers 1` até a fila ser migrada para persistência no banco.

---

## 🚀 Deploy

O projeto está publicado no **Render.com** com deploy automático a cada push na branch `main`.

### Variáveis de ambiente necessárias

**Backend:**
```
SUPABASE_URL, SUPABASE_KEY, FRONTEND_URL
```

**Frontend:**
```
VITE_API_URL=https://url-do-backend.onrender.com
```