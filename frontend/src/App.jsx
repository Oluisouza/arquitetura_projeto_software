import { useState } from 'react'

function App() {
  const [cliente, setCliente] = useState('Mesa 01')
  const [bebida, setBebida] = useState('')
  const [adicionais, setAdicionais] = useState([])
  const [resumo, setResumo] = useState(null)
  const [status, setStatus] = useState('')

 
  const toggleAdicional = (item) => {
    if (adicionais.includes(item)) {
      setAdicionais(adicionais.filter(a => a !== item))
    } else {
      setAdicionais([...adicionais, item])
    }
  }

  const calcularPedido = async () => {
    if (!bebida) {
      alert('Por favor, escolha uma bebida base primeiro!')
      return
    }
    
    setStatus('Calculando pedido...')
    
    try {
      const resposta = await fetch('https://cefeteria-cafe-teria.onrender.com/pedidos/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: cliente,
          bebida_base: bebida,
          adicionais: adicionais
        })
      })
      const data = await resposta.json()
      setResumo(data.dados) // Guarda a resposta da API na memória
      setStatus('Pedido calculado! Aguardando pagamento...')
    } catch (erro) {
      setStatus('Erro ao comunicar com o servidor Python.')
    }
  }

  const pagarPedido = async (metodo) => {
    if (!resumo) return
    setStatus('Processando com o banco...')
    
    try {
      const resposta = await fetch('https://cefeteria-cafe-teria.onrender.com/pedidos/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: resumo.total_a_pagar,
          metodo_pagamento: metodo,
          nome_cliente: cliente
        })
      })
      const data = await resposta.json()
      
      setStatus(`✅ ${data.mensagem} | ID Nuvem: ${data.id_pedido_banco}`)
      
      setTimeout(() => {
        setBebida('')
        setAdicionais([])
        setResumo(null)
        setStatus('')
        setCliente('Mesa ' + Math.floor(Math.random() * 100))
      }, 5000)
      
    } catch (erro) {
      setStatus('Erro ao processar pagamento.')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <header style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1>☕ PDV - Cafeteria Patterns</h1>
        <p style={{ color: 'blue', fontWeight: 'bold' }}>{status}</p>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        
        <div style={{ flex: 2, background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Montagem do Pedido</h2>
          
          <label>Nome do Cliente / Mesa: </label>
          <input 
            type="text" 
            value={cliente} 
            onChange={(e) => setCliente(e.target.value)} 
            style={{ padding: '5px', marginBottom: '20px' }}
          />

          <h3>1. Bebida Base</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => setBebida('espresso')}
              style={{ padding: '10px', background: bebida === 'espresso' ? '#ccc' : 'white' }}>
              Café Espresso (R$ 5)
            </button>
            <button 
              onClick={() => setBebida('cappuccino')}
              style={{ padding: '10px', background: bebida === 'cappuccino' ? '#ccc' : 'white' }}>
              Cappuccino (R$ 8.50)
            </button>
          </div>

          <h3>2. Adicionais</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => toggleAdicional('leite')}
              style={{ padding: '10px', background: adicionais.includes('leite') ? '#add8e6' : 'white' }}>
              + Leite (R$ 2)
            </button>
            <button 
              onClick={() => toggleAdicional('chantilly')}
              style={{ padding: '10px', background: adicionais.includes('chantilly') ? '#add8e6' : 'white' }}>
              + Chantilly (R$ 3.50)
            </button>
          </div>

          <button onClick={calcularPedido} style={{ padding: '15px', background: 'orange', fontWeight: 'bold', cursor: 'pointer' }}>
            Mandar para a Tela do Caixa ➔
          </button>
        </div>

        <div style={{ flex: 1, background: '#eef', padding: '20px', borderRadius: '8px' }}>
          <h2>Resumo do Caixa</h2>
          
          {resumo ? (
            <>
              <p>Cliente: <strong>{resumo.cliente}</strong></p>
              <p>Item: <strong>{resumo.item_preparado}</strong></p>
              <hr />
              <h3 style={{ color: 'green' }}>Total: R$ {resumo.total_a_pagar.toFixed(2)}</h3>
              
              <p>Forma de Pagamento:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => pagarPedido('pix')} style={{ padding: '10px', background: 'teal', color: 'white', cursor: 'pointer' }}>
                  PIX (Aprovação Imediata)
                </button>
                <button onClick={() => pagarPedido('cartao')} style={{ padding: '10px', background: 'navy', color: 'white', cursor: 'pointer' }}>
                  Cartão de Crédito
                </button>
                <button onClick={() => pagarPedido('dinheiro')} style={{ padding: '10px', background: 'green', color: 'white', cursor: 'pointer' }}>
                  Dinheiro
                </button>
              </div>
            </>
          ) : (
            <p>Monte o pedido ao lado e clique em enviar.</p>
          )}

        </div>
      </div>
    </div>
  )
}

export default App