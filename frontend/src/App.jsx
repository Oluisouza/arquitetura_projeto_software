import { useState, useEffect } from 'react';
import { Coffee, Grid, ClipboardList, History, Settings, LogOut, Search, Calendar, ShoppingBasket, CheckCircle, X, Trash2, QrCode, CreditCard, Banknote } from 'lucide-react';
import './index.css';

const getImagem = (categoria) => {
  if (categoria === 'cafe') return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop';
  if (categoria === 'suco') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop';
  if (categoria === 'comida') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop';
  return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop';
};

function App() {
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [carrinho, setCarrinho] = useState([]);
  const [resumoBackend, setResumoBackend] = useState(null);
  const [status, setStatus] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoModal, setProdutoModal] = useState(null);
  const [adicionaisModal, setAdicionaisModal] = useState([]);

  const API_URL = 'http://127.0.0.1:8000'; 

  useEffect(() => {
    const buscarCardapio = async () => {
      try {
        const resposta = await fetch(`${API_URL}/cardapio`);
        const data = await resposta.json();
        if (resposta.ok && data.dados) setTodosProdutos(data.dados);
      } catch (error) {
        setStatus('Erro ao carregar o cardápio.');
      }
    };
    buscarCardapio();
  }, []);

  // Filtros
  const produtosFiltrados = todosProdutos.filter(p => 
    p.categoria !== 'adicional_cafe' && p.categoria !== 'adicional_suco' && 
    (categoriaAtiva === 'todos' || p.categoria === categoriaAtiva)
  );

  const subtotalAtual = carrinho.reduce((sum, item) => {
    const prodBase = todosProdutos.find(p => p.nome === item.bebida_base);
    let itemTotal = prodBase ? prodBase.preco : 0;
    item.adicionais.forEach(adic => {
      const prodAdic = todosProdutos.find(p => p.nome === adic);
      if (prodAdic) itemTotal += prodAdic.preco;
    });
    return sum + itemTotal;
  }, 0);

  const abrirModal = (produto) => {
    setProdutoModal(produto);
    setAdicionaisModal([]);
    setModalAberto(true);
  };

  const toggleAdicionalModal = (nomeAdicional) => {
    if (adicionaisModal.includes(nomeAdicional)) {
      setAdicionaisModal(adicionaisModal.filter(a => a !== nomeAdicional));
    } else {
      setAdicionaisModal([...adicionaisModal, nomeAdicional]);
    }
  };

  const adicionarAoCarrinho = () => {
    const novoItem = {
      id: Date.now(),
      bebida_base: produtoModal.nome,
      adicionais: [...adicionaisModal]
    };
    setCarrinho([...carrinho, novoItem]);
    setModalAberto(false);
    setResumoBackend(null);
  };

  const removerDoCarrinho = (idParaRemover) => {
    setCarrinho(carrinho.filter(item => item.id !== idParaRemover));
    setResumoBackend(null);
  };

  const enviarParaCaixa = async () => {
    if (carrinho.length === 0) return;
    setStatus('Calculando...');
    try {
      const resposta = await fetch(`${API_URL}/pedidos/novo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_cliente: "Balcão", itens: carrinho })
      });
      const data = await resposta.json();
      if (!resposta.ok) return setStatus('Erro no Python.');
      setResumoBackend(data.dados);
      setStatus('Aguardando pagamento.');
    } catch (erro) {
      setStatus('Erro de conexão.');
    }
  };

  const pagarPedido = async (metodo) => {
    if (!resumoBackend) return;
    setStatus('Processando pagamento...');
    try {
      const resposta = await fetch(`${API_URL}/pedidos/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: resumoBackend.total_a_pagar,
          metodo_pagamento: metodo,
          nome_cliente: "Balcão"
        })
      });
      const data = await resposta.json();
      if (!resposta.ok) return setStatus(`Erro: ${data.detail}`);
      
      setStatus(`Pago! ID: ${data.id_pedido_banco.substring(0,8)}...`);
      setTimeout(() => {
        setCarrinho([]);
        setResumoBackend(null);
        setStatus('');
      }, 5000);
    } catch (erro) {
      setStatus('Erro ao processar pagamento.');
    }
  };

  const renderizarAdicionais = () => {
    if (!produtoModal) return null;
    let disponiveis = [];
    if (produtoModal.categoria === 'cafe') disponiveis = todosProdutos.filter(p => p.categoria === 'adicional_cafe');
    if (produtoModal.categoria === 'suco') disponiveis = todosProdutos.filter(p => p.categoria === 'adicional_suco');
    
    if (disponiveis.length === 0) return <p className="text-gray-500 text-sm">Este item não possui customizações extras.</p>;

    return disponiveis.map(adic => (
      <button 
        key={adic.id}
        onClick={() => toggleAdicionalModal(adic.nome)}
        className={`flex justify-between items-center p-3 border-2 rounded-xl transition-colors text-sm capitalize ${
          adicionaisModal.includes(adic.nome) ? 'border-amber-900 bg-amber-50 text-amber-900' : 'border-gray-100 hover:bg-gray-50'
        }`}
      >
        <span className="font-medium">{adic.nome}</span>
        <span className="font-bold">+R$ {adic.preco.toFixed(2)}</span>
      </button>
    ));
  };

  return (
    <div className="bg-gray-50 h-screen flex overflow-hidden">
      
      <aside className="w-20 bg-white border-r flex flex-col items-center py-6 gap-8 z-10">
        <div className="w-12 h-12 bg-amber-900 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Coffee size={24} />
        </div>
        <nav className="flex flex-col gap-6">
          <button className="p-3 rounded-xl bg-amber-50 text-amber-900"><Grid size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-100 transition"><ClipboardList size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-100 transition"><History size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-100 transition"><Settings size={24} /></button>
        </nav>
        <div className="mt-auto">
          <button className="p-3 rounded-xl text-red-400 hover:bg-red-50 transition"><LogOut size={24} /></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-10 rounded-md" onError={(e) => e.target.style.display = 'none'} />
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>Café Teria</h1>
              <p className="text-sm text-gray-500 font-medium">{status || 'Sistema de Atendimento PDV'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar produto..." className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-amber-900 w-64 outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg text-amber-900 font-medium text-sm">
              <Calendar size={18} />
              <span>Hoje</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-8 bg-white flex gap-8 border-b overflow-x-auto no-scrollbar">
            <button onClick={() => setCategoriaAtiva('todos')} className={`py-4 whitespace-nowrap ${categoriaAtiva === 'todos' ? 'border-b-4 border-amber-900 text-amber-900 font-bold' : 'text-gray-500'}`}>Todos</button>
            <button onClick={() => setCategoriaAtiva('cafe')} className={`py-4 whitespace-nowrap ${categoriaAtiva === 'cafe' ? 'border-b-4 border-amber-900 text-amber-900 font-bold' : 'text-gray-500'}`}>Cafés</button>
            <button onClick={() => setCategoriaAtiva('suco')} className={`py-4 whitespace-nowrap ${categoriaAtiva === 'suco' ? 'border-b-4 border-amber-900 text-amber-900 font-bold' : 'text-gray-500'}`}>Sucos e Gelados</button>
            <button onClick={() => setCategoriaAtiva('comida')} className={`py-4 whitespace-nowrap ${categoriaAtiva === 'comida' ? 'border-b-4 border-amber-900 text-amber-900 font-bold' : 'text-gray-500'}`}>Comidas</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {produtosFiltrados.map(p => (
                <div key={p.id} onClick={() => abrirModal(p)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100 flex flex-col">
                  <div className="h-40 overflow-hidden relative bg-gray-200">
                    <img src={getImagem(p.categoria)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-amber-900 shadow-sm">
                      R$ {p.preco.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-gray-800 group-hover:text-amber-900 transition-colors capitalize">{p.nome}</h3>
                    <p className="text-xs text-gray-500 mt-1">{p.categoria === 'comida' ? 'Pronto para servir' : 'Customizável'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <aside className="w-[400px] bg-white border-l flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Pedido Atual</h2>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">{carrinho.length} Itens</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 gap-4">
              <ShoppingBasket size={64} />
              <p className="font-medium">O carrinho está vazio</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {carrinho.map(item => {
                const prodBase = todosProdutos.find(p => p.nome === item.bebida_base);
                return (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={getImagem(prodBase?.categoria)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 truncate capitalize">{item.bebida_base}</h4>
                        <button onClick={() => removerDoCarrinho(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {item.adicionais.length > 0 ? `+ ${item.adicionais.join(', ')}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          {!resumoBackend ? (
            <>
              <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
                <span>Subtotal</span>
                <span className="text-amber-900">R$ {subtotalAtual.toFixed(2)}</span>
              </div>
              <button 
                onClick={enviarParaCaixa} 
                disabled={carrinho.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${carrinho.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-900 text-white hover:bg-amber-800 active:scale-95'}`}
              >
                <CheckCircle size={20} /> Fechar Mesa
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
                <span>Total Oficial</span>
                <span className="text-green-600">R$ {resumoBackend.total_a_pagar.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => pagarPedido('pix')} className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 flex flex-col items-center gap-1"><QrCode size={20}/>PIX</button>
                <button onClick={() => pagarPedido('cartao')} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex flex-col items-center gap-1"><CreditCard size={20}/>Cartão</button>
                <button onClick={() => pagarPedido('dinheiro')} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex flex-col items-center gap-1"><Banknote size={20}/>Dinheiro</button>
              </div>
            </>
          )}
        </div>
      </aside>

      {modalAberto && produtoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-48 bg-amber-900">
              <img src={getImagem(produtoModal.categoria)} className="w-full h-full object-cover opacity-60" />
              <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <h3 className="text-3xl font-bold capitalize" style={{ fontFamily: "'Playfair Display', serif" }}>{produtoModal.nome}</h3>
                <p className="text-amber-200 font-medium text-lg">R$ {produtoModal.preco.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">Adicionais e Extras</h4>
                <div className="grid grid-cols-2 gap-3">
                  {renderizarAdicionais()}
                </div>
              </div>

              <button onClick={adicionarAoCarrinho} className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-amber-800 transition-all flex items-center justify-center gap-2">
                Adicionar ao Pedido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;