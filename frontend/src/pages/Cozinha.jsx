import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, ArrowLeft } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const STATUS = {
  fila:    { label: 'Na Fila',    valor: 'Na fila da cozinha', cor: 'var(--caramel)',  bg: 'var(--caramel-l)', borda: '#D4A96A' },
  preparo: { label: 'Em Preparo', valor: 'Em preparo',         cor: 'var(--amber)',    bg: 'var(--amber-l)',   borda: '#D4B84A' },
  pronto:  { label: 'Pronto',     valor: 'Pronto',             cor: 'var(--forest)',   bg: 'var(--forest-l)', borda: '#7ABF8A' },
}

const ACOES = {
  'Na fila da cozinha': { label: 'Iniciar',  proximo: 'Em preparo', cor: 'var(--caramel)', bg: 'var(--caramel-l)' },
  'Em preparo':         { label: 'Pronto',   proximo: 'Pronto',     cor: 'var(--forest)',  bg: 'var(--forest-l)'  },
  'Pronto':             { label: 'Marchar',  proximo: 'Entregue',   cor: 'var(--forest)',  bg: 'var(--forest-l)'  },
}

const calcularMinutos = (criadoEm) => {
  const diff = Date.now() - new Date(criadoEm).getTime()
  return Math.floor(diff / 60000)
}

const formatarTimer = (criadoEm) => {
  const diff = Date.now() - new Date(criadoEm).getTime()
  const min  = Math.floor(diff / 60000)
  const seg  = Math.floor((diff % 60000) / 1000)
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
}

export default function Cozinha() {
  const navigate = useNavigate()
  const [pedidos, setPedidos]   = useState([])
  const [timers, setTimers]     = useState({})
  const [carregando, setCarregando] = useState(true)
  const intervalosRef = useRef({})

  // ── Busca pedidos ─────────────────────────────────────────
  const buscarPedidos = async () => {
    try {
      const resposta = await fetch(`${API_URL}/pedidos/status`)
      if (!resposta.ok) return
      const data = await resposta.json()

      // Busca lista completa para o kanban
      const respostaLista = await fetch(`${API_URL}/pedidos/cozinha`)
      if (!respostaLista.ok) return
      const lista = await respostaLista.json()
      setPedidos(lista.dados || [])
      setCarregando(false)
    } catch {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarPedidos()
    const intervalo = setInterval(buscarPedidos, 8000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Timer por pedido ──────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setTimers(prev => {
        const novo = {}
        pedidos.forEach(p => {
          novo[p.id] = formatarTimer(p.criado_em)
        })
        return novo
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [pedidos])

  // ── Atualiza status ───────────────────────────────────────
  const atualizarStatus = async (pedidoId, novoStatus) => {
    try {
      await fetch(`${API_URL}/pedidos/${pedidoId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: novoStatus }),
      })

      if (novoStatus === 'Entregue') {
        setPedidos(prev => prev.filter(p => p.id !== pedidoId))
      } else {
        setPedidos(prev =>
          prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p)
        )
      }
    } catch {
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  const pedidosPorStatus = (statusValor) =>
    pedidos.filter(p => p.status === statusValor)

  const totalAtivos = pedidos.length

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      background: 'var(--chalk)',
      overflow: 'hidden',
    }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'var(--espresso)',
        padding: '0.75rem 1.25rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '1rem',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--caramel)',
            borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Coffee size={16} color="white" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17, fontWeight: 700,
              color: 'white', lineHeight: 1.1,
            }}>
              Café Teria — Cozinha
            </h1>
            <p style={{
              fontSize: 10, color: 'rgba(255,255,255,.4)',
              fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginTop: 1,
            }}>
              Kitchen Display System
            </p>
          </div>
        </div>

        {/* Contadores */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} style={{
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 'var(--r-sm)',
              padding: '0.35rem 0.75rem',
              textAlign: 'center', minWidth: 64,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18, fontWeight: 700,
                color: s.cor, lineHeight: 1,
              }}>
                {pedidosPorStatus(s.valor).length}
              </div>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,.35)',
                fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', marginTop: 2,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 'var(--r-sm)',
            color: 'rgba(255,255,255,.6)',
            fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'all .15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
        >
          <ArrowLeft size={14} />
          PDV
        </button>
      </header>

      {/* ── KANBAN ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 0,
        overflow: 'hidden',
      }}>
        {Object.entries(STATUS).map(([key, s], colIndex) => (
          <div key={key} style={{
            display: 'flex', flexDirection: 'column',
            borderRight: colIndex < 2 ? '1px solid var(--border-s)' : 'none',
            overflow: 'hidden',
          }}>

            {/* Cabeçalho da coluna */}
            <div style={{
              padding: '0.75rem 1rem',
              background: 'white',
              borderBottom: '1px solid var(--border-s)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              flexShrink: 0,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: s.cor,
                boxShadow: `0 0 6px ${s.cor}`,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: s.cor,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {s.label}
              </span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 11, color: 'var(--mist)',
              }}>
                {pedidosPorStatus(s.valor).length}
              </span>
            </div>

            {/* Cards da coluna */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '0.75rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
            }}>

              {carregando && colIndex === 0 && (
                <p style={{ fontSize: 12, color: 'var(--mist)', textAlign: 'center', padding: '1rem' }}>
                  Carregando...
                </p>
              )}

              {!carregando && pedidosPorStatus(s.valor).length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', opacity: 0.3, gap: '0.4rem',
                }}>
                  <span style={{ fontSize: 24 }}>
                    {key === 'fila' ? '🕐' : key === 'preparo' ? '👨‍🍳' : '✅'}
                  </span>
                  <p style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 500 }}>
                    Nenhum pedido
                  </p>
                </div>
              )}

              {pedidosPorStatus(s.valor).map(pedido => {
                const minutos  = calcularMinutos(pedido.criado_em)
                const urgente  = minutos >= 10
                const acao     = ACOES[pedido.status]
                const itens    = pedido.item_preparado?.split(' | ') || []

                return (
                  <div key={pedido.id} style={{
                    background: 'white',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid var(--border-s)`,
                    borderLeft: `3px solid ${s.cor}`,
                    padding: '0.8rem',
                    boxShadow: 'var(--shadow-s)',
                    transition: 'box-shadow .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-m)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-s)'}
                  >
                    {/* Número e tempo */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '0.3rem',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9, color: 'var(--mist)',
                        letterSpacing: '0.07em',
                      }}>
                        #{String(pedido.id).slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10, fontWeight: 600,
                        color: urgente ? 'var(--red)' : 'var(--mist)',
                        animation: urgente ? 'blink 1s infinite' : 'none',
                      }}>
                        ⏱ {timers[pedido.id] || '00:00'}
                      </span>
                    </div>

                    {/* Mesa */}
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 15, fontWeight: 600,
                      color: key === 'pronto' ? 'var(--forest)' : 'var(--espresso)',
                      marginBottom: '0.45rem',
                    }}>
                      {pedido.nome_cliente}
                    </p>

                    {/* Itens */}
                    <div style={{ marginBottom: '0.65rem' }}>
                      {itens.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '2px 0',
                        }}>
                          <span style={{
                            fontSize: 9, color: 'var(--border)',
                            flexShrink: 0,
                          }}>
                            —
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: key === 'pronto' ? 'var(--mist)' : 'var(--ink)',
                            textDecoration: key === 'pronto' ? 'line-through' : 'none',
                            opacity: key === 'pronto' ? 0.6 : 1,
                            textTransform: 'capitalize',
                          }}>
                            {item.trim()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Rodapé do card */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11, color: 'var(--mist)',
                      }}>
                        R$ {Number(pedido.total_pago).toFixed(2)}
                      </span>

                      {acao && (
                        <button
                          onClick={() => atualizarStatus(pedido.id, acao.proximo)}
                          style={{
                            padding: '0.35rem 0.85rem',
                            background: acao.bg,
                            color: acao.cor,
                            border: `1px solid ${acao.cor}22`,
                            borderRadius: 7,
                            fontFamily: 'var(--font-body)',
                            fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = acao.cor
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = acao.bg
                            e.currentTarget.style.color = acao.cor
                          }}
                        >
                          {acao.label} →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}