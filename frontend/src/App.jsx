import { useState } from 'react';
import { Coffee, Plus, Trash2, Send, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import './index.css'; 

function App() {
  const [cliente, setCliente] = useState('Mesa 01');
  const [bebidaBase, setBebidaBase] = useState('');
  const [adicionais, setAdicionais] = useState([]);
  
  const [carrinho, setCarrinho] = useState([]);
  const [resumoBackend, setResumoBackend] = useState(null);
  const [status, setStatus] = useState('');

  const toggleAdicional = (item) => {
    if (adicionais.includes(item)) {
      setAdicionais(adicionais.filter((a) => a !== item));
    } else {
      setAdicionais([...adicionais, item]);
    }
  };

  const adicionarAoCarrinho = () => {
    if (!bebidaBase) {
      alert('Selecione um café primeiro!');
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
    setStatus('Calculando...');
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
      setResumoBackend(data.dados);
      setStatus('Conta fechada. Aguardando pagamento.');
    } catch (erro) {
      setStatus('Erro de conexão com o servidor.');
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
      setStatus(`Pagamento Aprovado! ID: ${data.id_pedido_banco}`);
      
      setTimeout(() => {
        setCarrinho([]);
        setResumoBackend(null);
        setStatus('');
        setCliente('Mesa ' + Math.floor(Math.random() * 100));
      }, 6000);
    } catch (erro) {
      setStatus('Erro ao processar pagamento.');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo">
          <Coffee size={32} color="#8B5E3C" />
          <h1 className="logo-text">Cafeteria Patterns</h1>
        </div>
        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C9A84C', fontWeight: '600' }}>
            <CheckCircle2 size={20} /> {status}
          </div>
        )}
      </header>

      <div className="main-layout">
        
        <section className="card" style={{ flex: 3 }}>
          <h2>Novo Item</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Identificação e montagem da bebida.</p>

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
            <button 
              className={`btn btn-outline ${bebidaBase === 'espresso' ? 'active' : ''}`}
              onClick={() => setBebidaBase('espresso')}
            >
              <Coffee size={20} /> Espresso (R$ 5)
            </button>
            <button 
              className={`btn btn-outline ${bebidaBase === 'cappuccino' ? 'active' : ''}`}
              onClick={() => setBebidaBase('cappuccino')}
            >
              <Coffee size={20} /> Cappuccino (R$ 8.50)
            </button>
          </div>

          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>2. Adicionais (Opcional)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <button 
              className={`btn btn-outline ${adicionais.includes('leite') ? 'active' : ''}`}
              onClick={() => toggleAdicional('leite')}
            >
              <Plus size={20} /> Leite (+R$ 2)
            </button>
            <button 
              className={`btn btn-outline ${adicionais.includes('chantilly') ? 'active' : ''}`}
              onClick={() => toggleAdicional('chantilly')}
            >
              <Plus size={20} /> Chantilly (+R$ 3.50)
            </button>
          </div>

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
            {resumoBackend ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0 }}>Total</h3>
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
                <Send size={20} /> Calcular Total da Mesa
              </button>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;