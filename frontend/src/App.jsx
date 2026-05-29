import { useState } from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <header style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1>☕ PDV - Cafeteria Patterns</h1>
        <p>Sistema do Atendente</p>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        
        <div style={{ flex: 2, background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Cardápio</h2>
          <p>Aqui colocaremos os botões de Café, Adicionais, etc.</p>
        </div>

        <div style={{ flex: 1, background: '#eef', padding: '20px', borderRadius: '8px' }}>
          <h2>Resumo da Mesa</h2>
          <p>Cliente: <strong>[Nome]</strong></p>
          <hr />
          <p>Aqui aparecerão os itens...</p>
          <h3>Total: R$ 0,00</h3>
          <button style={{ padding: '10px', background: 'green', color: 'white', width: '100%', border: 'none', cursor: 'pointer' }}>
            Finalizar Pagamento
          </button>
        </div>

      </div>

    </div>
  )
}

export default App