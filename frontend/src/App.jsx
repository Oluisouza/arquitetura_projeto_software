import { useState, useEffect } from 'react';
import { Coffee, Plus, Trash2, Send, CreditCard, Banknote, QrCode, CheckCircle2, Croissant } from 'lucide-react';
import './index.css';

function App() {
  const [cliente, setCliente] = useState('Mesa 01');
  const [bebidaBase, setBebidaBase] = useState('');
  const [adicionais, setAdicionais] = useState([]);
  
  const [carrinho, setCarrinho] = useState([]);
  const [resumoBackend, setResumoBackend] = useState(null);
  const [status, setStatus] = useState('');

  const [cardapio, setCardapio] = useState({ bebida: [], adicional: [], comida: [] });

  useEffect(() => {
    const buscarCardapio = async () => {
      try {
        const resposta = await fetch('https://cefeteria-cafe-teria.onrender.com/cardapio');
        const data = await resposta.json();
        
        if (resposta.ok && data.dados) {
          const bebidas = data.dados.filter(p => p.categoria === 'bebida');
          const adicionais = data.dados.filter(p => p.categoria === 'adicional');
          const comidas = data.dados.filter(p => p.categoria === 'comida');
          
          setCardapio({ bebida: bebidas, adicional: adicionais, comida: comidas });
        }
      } catch (error) {
        setStatus('❌ Erro ao carregar o cardápio do servidor.');
      }
    };

    buscarCardapio();
  }, []);

  const calcularSubtotalEstimado = () => {
    let subtotal = 0;
    const todosProdutos = [...cardapio.bebida, ...cardapio.adicional, ...cardapio.comida];
    
    carrinho.forEach(item => {
      const prodBase = todosProdutos.find(p => p.nome === item.bebida_base);
      if (prodBase) subtotal += prodBase.preco;
      
      item.adicionais.forEach(adic => {
        const prodAdic = todosProdutos.find(p => p.nome === adic);
        if (prodAdic) subtotal += prodAdic.preco;
      });
    });
    return subtotal;
  };

  const toggleAdicional = (itemNome) => {
    if (adicionais.includes(itemNome)) {
      setAdicionais(adicionais.filter((a) => a !== itemNome));
    } else {
      setAdicionais([...adicionais, itemNome]);
    }
  };

  const adicionarAoCarrinho = () => {
    if (!bebidaBase) {
      alert('Selecione um item base primeiro!');
      return;
    }
    const novoItem = {
      id: Date.now(),
      bebida_base: bebidaBase,
      adicionais: [...adicionais]
    };
    setCarrinho([...carrinho, novoItem]);
    
    setBebidaBase('');
    setAdicionais([]);
    setStatus('');
    setResumoBackend(null); 
  };

  const removerDoCarrinho = (idParaRemover) => {
    setCarrinho(carrinho.filter(item => item.id !== idParaRemover));
    setResumoBackend(null);
  };

  const enviarParaCaixa = async () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio!');
      return;
    }
    setStatus('Calculando no servidor...');
    try {
      const resposta = await fetch('https://cefeteria-cafe-teria.onrender.com/pedidos/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: cliente,
          itens: carrinho 
        })
      });
      
      const data = await resposta.json();

      if (!resposta.ok) {
        setStatus('❌ Erro no Python. Verifique o terminal.');
        return;
      }

      setResumoBackend(data.dados);
      setStatus('Conta fechada. Aguardando pagamento.');
    } catch (erro) {
      setStatus('❌ Erro de conexão com o servidor.');
    }
  };

  const pagarPedido = async (metodo) => {
    if (!resumoBackend) return;
    setStatus('Processando com o banco...');
    try {
      const resposta = await fetch('https://cefeteria-cafe-teria.onrender.com/pedidos/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: resumoBackend.total_a_pagar,
          metodo_pagamento: metodo,
          nome_cliente: cliente
        })
      });
      
      const data = await resposta.json();

      if (!resposta.ok) {
        setStatus(`❌ Erro no pagamento: ${data.detail}`);
        return;
      }

      setStatus(`Pagamento Aprovado! ID: ${data.id_pedido_banco}`);
      
      setTimeout(() => {
        setCarrinho([]);
        setResumoBackend(null);
        setStatus('');
        setCliente('Mesa ' + Math.floor(Math.random() * 100));
      }, 6000);
    } catch (erro) {
      setStatus('❌ Erro ao processar pagamento.');
    }
  };

  const subtotalAtual = calcularSubtotalEstimado();

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo">
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ height: '120px', width: 'auto', borderRadius: '8px', objectFit: 'cover' }} 
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="logo-text">Café Teria</h1> 
        </div>
        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status.includes('❌') ? 'red' : '#C9A84C', fontWeight: '600' }}>
            {status.includes('❌') ? null : <CheckCircle2 size={20} />} 
            {status}
          </div>
        )}
      </header>

      <div className="main-layout">
        
        <section className="card" style={{ flex: 3 }}>
          <h2>Novo Item</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Identificação e montagem do pedido.</p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Cliente ou Mesa</label>
            <input 
              className="input-field"
              type="text" 
              value={cliente} 
              onChange={(e) => setCliente(e.target.value)} 
            />
          </div>

          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>1. Escolha a Bebida Base</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {cardapio.bebida.map((bebida) => (
              <button 
                key={bebida.id}
                className={`btn btn-outline ${bebidaBase === bebida.nome ? 'active' : ''}`}
                onClick={() => setBebidaBase(bebida.nome)}
                style={{ textTransform: 'capitalize' }}
              >
                <Coffee size={20} /> {bebida.nome} (R$ {bebida.preco.toFixed(2)})
              </button>
            ))}
          </div>

          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>2. Adicionais (Opcional)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {cardapio.adicional.map((adic) => (
              <button 
                key={adic.id}
                className={`btn btn-outline ${adicionais.includes(adic.nome) ? 'active' : ''}`}
                onClick={() => toggleAdicional(adic.nome)}
                style={{ textTransform: 'capitalize' }}
              >
                <Plus size={20} /> {adic.nome} (+R$ {adic.preco.toFixed(2)})
              </button>
            ))}
          </div>

          {cardapio.comida.length > 0 && (
            <>
              <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>3. Comidas / Acompanhamentos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                {cardapio.comida.map((comida) => (
                  <button 
                    key={comida.id}
                    className={`btn btn-outline ${bebidaBase === comida.nome ? 'active' : ''}`}
                    onClick={() => setBebidaBase(comida.nome)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    <Croissant size={20} /> {comida.nome} (R$ {comida.preco.toFixed(2)})
                  </button>
                ))}
              </div>
            </>
          )}

          <button className="btn btn-primary" onClick={adicionarAoCarrinho}>
            Adicionar à Bandeja
          </button>
        </section>

        <section className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <h2>Bandeja da {cliente}</h2>
          
          <div style={{ flex: 1, marginTop: '24px', overflowY: 'auto' }}>
            {carrinho.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>Nenhum item na bandeja.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {carrinho.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5EFE6', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ display: 'block', textTransform: 'capitalize' }}>{item.bebida_base}</strong>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {item.adicionais.length > 0 ? `+ ${item.adicionais.join(', ')}` : 'Sem adicionais'}
                      </span>
                    </div>
                    <button onClick={() => removerDoCarrinho(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d9534f' }}>
                      <Trash2 size={24} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
            
            {carrinho.length > 0 && !resumoBackend && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#666', fontSize: '16px' }}>
                <span>Subtotal Atual:</span>
                <span style={{ fontWeight: '600' }}>R$ {subtotalAtual.toFixed(2)}</span>
              </div>
            )}

            {resumoBackend ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0 }}>Total Oficial</h3>
                  <h2 style={{ margin: 0, color: '#C9A84C' }}>R$ {resumoBackend.total_a_pagar.toFixed(2)}</h2>
                </div>
                
                <p style={{ marginBottom: '12px', fontWeight: '500' }}>Finalizar Pagamento:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-gold" onClick={() => pagarPedido('pix')}>
                    <QrCode size={20} /> PIX
                  </button>
                  <button className="btn btn-gold" onClick={() => pagarPedido('cartao')}>
                    <CreditCard size={20} /> Cartão de Crédito
                  </button>
                  <button className="btn btn-gold" onClick={() => pagarPedido('dinheiro')}>
                    <Banknote size={20} /> Dinheiro
                  </button>
                </div>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={enviarParaCaixa}
                disabled={carrinho.length === 0}
                style={{ opacity: carrinho.length === 0 ? 0.5 : 1 }}
              >
                <Send size={20} /> Confirmar & Fechar Mesa
              </button>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;