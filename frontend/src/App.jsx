import { useState, useEffect } from 'react';
import { 
  Coffee, Grid, ClipboardList, History, Settings, LogOut, Search, 
  Calendar, ShoppingBasket, CheckCircle, X, Trash2, QrCode, 
  CreditCard, Banknote, Plus, Minus
} from 'lucide-react';

// Função auxiliar para gerar imagens baseadas na categoria
const getImagem = (categoria) => {
  if (categoria === 'cafe') return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop';
  if (categoria === 'suco') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop';
  if (categoria === 'comida') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop';
  return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop';
};

function App() {
  // ==========================================
  // ESTADOS DO REACT
  // ==========================================
  const [cliente, setCliente] = useState('Mesa 01');
  const [carrinho, setCarrinho] = useState([]);
  const [resumoBackend, setResumoBackend] = useState(null);
  const [status, setStatus] = useState('');
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoModal, setProdutoModal] = useState(null);
  const [adicionaisModal, setAdicionaisModal] = useState([]);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('pequeno');

  const API_URL = import.meta.env.VITE_API_URL

  // Busca o cardápio dinâmico
  useEffect(() => {
    const buscarCardapio = async () => {
      try {
        const resposta = await fetch(`${API_URL}/cardapio`);
        const data = await resposta.json();
        if (resposta.ok && data.dados) {
          setTodosProdutos(data.dados);
        }
      } catch (error) {
        setStatus('❌ Erro ao carregar o cardápio.');
      }
    };
    buscarCardapio();
  }, []);

  // ==========================================
  // LÓGICA DE FILTRO E BUSCA
  // ==========================================
  const produtosFiltrados = todosProdutos.filter(p => {
    const ehProdutoBase = !p.categoria.startsWith('adicional_');
    const matchesCategoria = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
    const matchesBusca = p.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return ehProdutoBase && matchesCategoria && matchesBusca;
  });

  // ==========================================
  // LÓGICA DO CARRINHO (AGRUPADO)
  // ==========================================
  const abrirModal = (produto) => {
    setProdutoModal(produto);
    setAdicionaisModal([]);
    setTamanhoSelecionado('pequeno');
    setModalAberto(true);
  };

  const adicionarAoCarrinho = () => {
    const adicionaisFinais = [...adicionaisModal];
    if (tamanhoSelecionado !== 'pequeno') {
      adicionaisFinais.push(tamanhoSelecionado);
    }

    // Criar uma chave única para agrupamento (Nome + Tamanho + Adicionais ordenados)
    const chaveUnica = `${produtoModal.nome}-${tamanhoSelecionado}-${adicionaisModal.sort().join(',')}`;
    
    const itemExistente = carrinho.find(item => item.chaveUnica === chaveUnica);

    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.chaveUnica === chaveUnica ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      const novoItem = {
        id: Date.now(),
        chaveUnica,
        bebida_base: produtoModal.nome,
        adicionais: adicionaisFinais,
        quantidade: 1,
        imagem: produtoModal.imagem_url || getImagem(produtoModal.categoria),
        precoUnitario: calcularPrecoModal()
      };
      setCarrinho([...carrinho, novoItem]);
    }

    setModalAberto(false);
    setResumoBackend(null);
  };

  const alterarQuantidade = (chaveUnica, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.chaveUnica === chaveUnica) {
        const novaQtd = Math.max(0, item.quantidade + delta);
        return { ...item, quantidade: novaQtd };
      }
      return item;
    }).filter(item => item.quantidade > 0));
    setResumoBackend(null);
  };

  const removerDoCarrinho = (chaveUnica) => {
    setCarrinho(carrinho.filter(item => item.chaveUnica !== chaveUnica));
    setResumoBackend(null);
  };

  // ==========================================
  // CÁLCULOS
  // ==========================================
  const calcularPrecoModal = () => {
    if (!produtoModal) return 0;
    let total = produtoModal.preco;
    
    // Busca preços dinâmicos de tamanhos se existirem no banco
    if (tamanhoSelecionado === 'médio') {
      total += todosProdutos.find(p => p.nome === 'médio')?.preco || 2.00;
    } else if (tamanhoSelecionado === 'grande') {
      total += todosProdutos.find(p => p.nome === 'grande')?.preco || 4.00;
    }

    adicionaisModal.forEach(nomeAdic => {
      const adic = todosProdutos.find(p => p.nome === nomeAdic);
      if (adic) total += adic.preco;
    });

    return total;
  };

  const subtotalEstimado = carrinho.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);

  // ==========================================
  // INTEGRAÇÃO BACKEND
  // ==========================================
  const enviarParaCaixa = async () => {
    if (carrinho.length === 0) return;
    setStatus('Calculando no servidor...');
    try {
      // Formata os itens para o formato que o backend espera (se necessário)
      const itensParaBackend = carrinho.flatMap(item => 
        Array(item.quantidade).fill({
          bebida_base: item.bebida_base,
          adicionais: item.adicionais
        })
      );

      const resposta = await fetch(`${API_URL}/pedidos/novo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_cliente: cliente, itens: itensParaBackend })
      });
      
      const data = await resposta.json();
      if (resposta.ok) {
        setResumoBackend(data.dados);
        setStatus('Conta fechada. Aguardando pagamento.');
      } else {
        setStatus('❌ Erro ao processar pedido.');
      }
    } catch (erro) {
      setStatus('❌ Erro de conexão.');
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
          nome_cliente: cliente
        })
      });
      
      if (resposta.ok) {
        setStatus(`✅ Pagamento Aprovado!`);
        setTimeout(() => {
          setCarrinho([]);
          setResumoBackend(null);
          setStatus('');
          setCliente('Mesa ' + Math.floor(Math.random() * 100));
        }, 3000);
      }
    } catch (erro) {
      setStatus('❌ Erro no pagamento.');
    }
  };

  const toggleAdicionalModal = (nomeAdicional) => {
    setAdicionaisModal(prev => 
      prev.includes(nomeAdicional) ? prev.filter(a => a !== nomeAdicional) : [...prev, nomeAdicional]
    );
  };

  return (
    <div className="bg-gray-50 h-screen flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-20 bg-white border-r flex flex-col items-center py-6 gap-8 z-10 shadow-sm">
        <div className="w-12 h-12 bg-amber-900 rounded-2xl flex items-center justify-center text-white shadow-md hover:scale-105 transition-all cursor-pointer">
          <Coffee size={24} />
        </div>
        <nav className="flex flex-col gap-6">
          <button className="p-3 rounded-xl bg-amber-50 text-amber-900"><Grid size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 transition"><ClipboardList size={24} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 transition"><History size={24} /></button>
        </nav>
        <div className="mt-auto">
          <button className="p-3 rounded-xl text-red-400 hover:bg-red-50 transition"><LogOut size={24} /></button>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-24 bg-white border-b px-8 flex items-center justify-between shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Café Teria</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{status || 'Painel do Atendente'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produto..." 
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-amber-900 w-64 outline-none text-sm" 
              />
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-xl text-amber-900 font-bold text-xs uppercase flex items-center gap-2">
              <Calendar size={14} /> Ativo
            </div>
          </div>
        </header>

        {/* CATEGORIAS */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-8 bg-white flex gap-8 border-b overflow-x-auto no-scrollbar">
            {['todos', 'cafe', 'suco', 'comida'].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoriaAtiva(cat)} 
                className={`py-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all ${categoriaAtiva === cat ? 'border-b-4 border-amber-900 text-amber-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {cat === 'suco' ? 'Gelados' : cat}
              </button>
            ))}
          </div>

          {/* GRID DE PRODUTOS */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#FDFAF6] custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {produtosFiltrados.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => abrirModal(p)} 
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100 flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative bg-gray-100">
                    <img src={p.imagem_url || getImagem(p.categoria)} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-amber-900">
                      R$ {p.preco.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 capitalize">{p.nome}</h3>
                    <p className="text-[10px] text-gray-400 uppercase mt-1 font-bold tracking-tighter">
                      {p.categoria === 'comida' ? 'Pronto' : 'Customizável'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* CARRINHO */}
      <aside className="w-96 bg-white border-l flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pedido Atual</h2>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identificação</label>
            <input 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-900"
              type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 opacity-50 gap-4">
              <ShoppingBasket size={48} />
              <p className="font-bold">Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {carrinho.map(item => (
                <div key={item.chaveUnica} className="flex gap-4 p-2 rounded-2xl hover:bg-gray-50 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={item.imagem} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-800 text-sm truncate capitalize">{item.bebida_base}</h4>
                      <button onClick={() => removerDoCarrinho(item.chaveUnica)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{item.adicionais.join(', ') || 'Original'}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => alterarQuantidade(item.chaveUnica, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={12}/></button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.chaveUnica, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={12}/></button>
                      </div>
                      <span className="font-bold text-amber-900 text-sm">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          {!resumoBackend ? (
            <>
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-4">
                <span>Subtotal Estimado</span>
                <span className="text-amber-900 text-lg">R$ {subtotalEstimado.toFixed(2)}</span>
              </div>
              <button 
                onClick={enviarParaCaixa} 
                disabled={carrinho.length === 0}
                className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${carrinho.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-amber-900 text-white hover:bg-amber-800'}`}
              >
                <CheckCircle size={18} /> Confirmar Pedido
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span className="text-green-600">R$ {resumoBackend.total_a_pagar.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => pagarPedido('pix')} className="bg-teal-600 text-white p-3 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1"><QrCode size={16}/>PIX</button>
                <button onClick={() => pagarPedido('cartao')} className="bg-blue-600 text-white p-3 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1"><CreditCard size={16}/>CARTÃO</button>
                <button onClick={() => pagarPedido('dinheiro')} className="bg-green-600 text-white p-3 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1"><Banknote size={16}/>DINHEIRO</button>
              </div>
              <button onClick={() => setResumoBackend(null)} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600">Voltar para edição</button>
            </div>
          )}
        </div>
      </aside>

      {/* MODAL */}
      {modalAberto && produtoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="relative h-40 bg-amber-900">
              <img src={produtoModal.imagem_url || getImagem(produtoModal.categoria)} className="w-full h-full object-cover opacity-50" />
              <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full text-white flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <h3 className="text-2xl font-bold capitalize">{produtoModal.nome}</h3>
                <p className="text-amber-200 text-sm font-bold">Base: R$ {produtoModal.preco.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {(produtoModal.categoria === 'cafe' || produtoModal.categoria === 'suco') && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tamanho</h4>
                  <div className="flex gap-2">
                    {['pequeno', 'médio', 'grande'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTamanhoSelecionado(t)} 
                        className={`flex-1 py-2 border-2 rounded-xl text-xs font-bold transition-all ${tamanhoSelecionado === t ? 'border-amber-900 bg-amber-50 text-amber-900' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Adicionais</h4>
                <div className="grid grid-cols-2 gap-2">
                  {todosProdutos.filter(p => p.categoria === `adicional_${produtoModal.categoria}`).map(adic => (
                    <button 
                      key={adic.id}
                      onClick={() => toggleAdicionalModal(adic.nome)}
                      className={`flex justify-between items-center p-3 border-2 rounded-xl text-[10px] font-bold transition-all ${adicionaisModal.includes(adic.nome) ? 'border-amber-900 bg-amber-50 text-amber-900' : 'border-gray-100 text-gray-400'}`}
                    >
                      <span>{adic.nome.toUpperCase()}</span>
                      <span>+ R$ {adic.preco.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={adicionarAoCarrinho} className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-amber-800 transition-all">
                ADICIONAR — R$ {calcularPrecoModal().toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;