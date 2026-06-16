import { useState, useEffect, useRef } from 'react'
import {
    Coffee, Grid, ClipboardList, History, LogOut, Search,
    ShoppingBasket, Trash2, Plus, Minus, QrCode, CreditCard,
    Banknote, CheckCircle, Bell, X, ChevronUp, ChevronDown
} from 'lucide-react'
import ProdutoCard from '../components/ProdutoCard'
import { apiFetch } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORIAS = [
    { id: 'todos', label: 'Todos' },
    { id: 'cafe', label: 'Cafés' },
    { id: 'suco', label: 'Gelados' },
    { id: 'comida', label: 'Comidas' },
]

const getImagem = (categoria) => {
    if (categoria === 'cafe') return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop'
    if (categoria === 'suco') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop'
    if (categoria === 'comida') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop'
    return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop'
}

// Hook para detectar mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])
    return isMobile
}

export default function PDV() {
    const isMobile = useIsMobile()

    const [cliente, setCliente] = useState('Mesa 01')
    const [carrinho, setCarrinho] = useState([])
    const [resumoBackend, setResumoBackend] = useState(null)
    const [status, setStatus] = useState('')
    const [todosProdutos, setTodosProdutos] = useState([])
    const [categoriaAtiva, setCategoriaAtiva] = useState('todos')
    const [termoBusca, setTermoBusca] = useState('')
    const [modalAberto, setModalAberto] = useState(false)
    const [produtoModal, setProdutoModal] = useState(null)
    const [adicionaisModal, setAdicionaisModal] = useState([])
    const [tamanhoSelecionado, setTamanhoSelecionado] = useState('pequeno')
    const [notificacao, setNotificacao] = useState(null)
    const [contagemStatus, setContagemStatus] = useState({ fila: 0, preparo: 0, pronto: 0 })
    const [prontoExpandido, setProntoExpandido] = useState(true)
    const [pedidosProntos, setPedidosProntos] = useState([])
    const [carrinhoAberto, setCarrinhoAberto] = useState(false)
    const notificacaoTimerRef = useRef(null)
    const idsNotificados = useRef(new Set())

    useEffect(() => {
        const buscarCardapio = async () => {
            try {
                const resposta = await fetch(`${API_URL}/cardapio`)
                const data = await resposta.json()
                if (resposta.ok && data.dados) setTodosProdutos(data.dados)
            } catch {
                setStatus('❌ Erro ao carregar o cardápio.')
            }
        }
        buscarCardapio()
    }, [])

    useEffect(() => {
        if (carrinho.length > 0) {
            setProntoExpandido(false)
        } else if (pedidosProntos.length > 0) {
            setProntoExpandido(true)
        }
    }, [carrinho.length, pedidosProntos.length])

    // Busca inicial dos contadores
    useEffect(() => {
        const buscarStatus = async () => {
            try {
                const resposta = await fetch(`${API_URL}/pedidos/status`)
                if (!resposta.ok) return
                const data = await resposta.json()
                setContagemStatus(data)
                if (data.pedidos_prontos) {
                    setPedidosProntos(data.pedidos_prontos)
                    for (const pedido of data.pedidos_prontos) {
                        const id = String(pedido.id)
                        if (!idsNotificados.current.has(id)) {
                            idsNotificados.current.add(id)
                            exibirNotificacao(pedido.nome_cliente)
                            break
                        }
                    }
                }
            } catch { }
        }
        buscarStatus()
    }, [])

    // SSE
    useEffect(() => {
        const source = new EventSource(`${API_URL}/pedidos/stream`)
        source.addEventListener('status_atualizado', () => {
            fetch(`${API_URL}/pedidos/status`)
                .then(r => r.json())
                .then(data => {
                    setContagemStatus(data)
                    if (data.pedidos_prontos) {
                        setPedidosProntos(data.pedidos_prontos)
                        for (const pedido of data.pedidos_prontos) {
                            const id = String(pedido.id)
                            if (!idsNotificados.current.has(id)) {
                                idsNotificados.current.add(id)
                                exibirNotificacao(pedido.nome_cliente)
                                break
                            }
                        }
                    }
                })
                .catch(() => { })
        })
        source.onerror = () => console.log('SSE PDV: reconectando...')
        return () => source.close()
    }, [])

    const exibirNotificacao = (nomePedido) => {
        if (notificacaoTimerRef.current) clearTimeout(notificacaoTimerRef.current)
        setNotificacao(nomePedido)
        notificacaoTimerRef.current = setTimeout(() => setNotificacao(null), 7000)
    }

    const produtosFiltrados = todosProdutos.filter(p => {
        const ehBase = !p.categoria.startsWith('adicional_') && p.categoria !== 'adicional_tamanho'
        const matchCategoria = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva
        const matchBusca = p.nome.toLowerCase().includes(termoBusca.toLowerCase())
        return ehBase && matchCategoria && matchBusca
    })

    const subtotalEstimado = carrinho.reduce(
        (acc, item) => acc + item.precoUnitario * item.quantidade, 0
    )

    const abrirModal = (produto) => {
        setProdutoModal(produto)
        setAdicionaisModal([])
        setTamanhoSelecionado('pequeno')
        setModalAberto(true)
    }

    const toggleAdicional = (nome) => {
        setAdicionaisModal(prev =>
            prev.includes(nome) ? prev.filter(a => a !== nome) : [...prev, nome]
        )
    }

    const calcularPrecoModal = () => {
        if (!produtoModal) return 0
        let total = produtoModal.preco
        if (tamanhoSelecionado === 'médio')
            total += todosProdutos.find(p => p.nome === 'médio')?.preco || 2.00
        if (tamanhoSelecionado === 'grande')
            total += todosProdutos.find(p => p.nome === 'grande')?.preco || 4.00
        adicionaisModal.forEach(nome => {
            const adic = todosProdutos.find(p => p.nome === nome)
            if (adic) total += adic.preco
        })
        return total
    }

    const adicionarAoCarrinho = () => {
        const adicionaisFinais = [...adicionaisModal]
        if (tamanhoSelecionado !== 'pequeno') adicionaisFinais.push(tamanhoSelecionado)
        const chaveUnica = `${produtoModal.nome}-${tamanhoSelecionado}-${[...adicionaisModal].sort().join(',')}`
        const itemExistente = carrinho.find(item => item.chaveUnica === chaveUnica)
        if (itemExistente) {
            setCarrinho(prev =>
                prev.map(item =>
                    item.chaveUnica === chaveUnica
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                )
            )
        } else {
            setCarrinho(prev => [...prev, {
                id: Date.now(), chaveUnica,
                bebida_base: produtoModal.nome,
                adicionais: adicionaisFinais,
                quantidade: 1,
                imagem: produtoModal.imagem_url || getImagem(produtoModal.categoria),
                precoUnitario: calcularPrecoModal(),
            }])
        }
        setModalAberto(false)
        setResumoBackend(null)
    }

    const alterarQuantidade = (chaveUnica, delta) => {
        setCarrinho(prev =>
            prev
                .map(item =>
                    item.chaveUnica === chaveUnica
                        ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
                        : item
                )
                .filter(item => item.quantidade > 0)
        )
        setResumoBackend(null)
    }

    const removerDoCarrinho = (chaveUnica) => {
        setCarrinho(prev => prev.filter(item => item.chaveUnica !== chaveUnica))
        setResumoBackend(null)
    }

    const entregarPedido = async (pedidoId) => {
        try {
            await apiFetch(`/pedidos/${pedidoId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'Entregue' }),
            })
            setPedidosProntos(prev => prev.filter(p => p.id !== pedidoId))
            idsNotificados.current.delete(String(pedidoId))
        } catch {
            setStatus('❌ Erro ao registrar entrega.')
        }
    }

    const enviarParaCaixa = async () => {
        if (carrinho.length === 0) return
        setStatus('Calculando no servidor...')
        try {
            const itensParaBackend = carrinho.flatMap(item =>
                Array(item.quantidade).fill({
                    bebida_base: item.bebida_base,
                    adicionais: item.adicionais,
                })
            )
            const resposta = await apiFetch(`/pedidos/novo`, {
                method: 'POST',
                body: JSON.stringify({ nome_cliente: cliente, itens: itensParaBackend }),
            })
            const data = await resposta.json()
            if (resposta.ok) {
                setResumoBackend(data.dados)
                setStatus('Aguardando pagamento.')
            } else {
                setStatus('❌ Erro ao processar pedido.')
            }
        } catch {
            setStatus('❌ Erro de conexão.')
        }
    }

    const pagarPedido = async (metodo) => {
        if (!resumoBackend) return
        setStatus('Processando pagamento...')
        try {
            const resposta = await apiFetch(`/pedidos/pagar`, {
                method: 'POST',
                body: JSON.stringify({
                    valor_total: resumoBackend.total_a_pagar,
                    metodo_pagamento: metodo,
                    nome_cliente: cliente,
                    item_preparado: resumoBackend.item_preparado,
                }),
            })
            if (resposta.ok) {
                setStatus('✅ Pedido enviado para a cozinha!')
                setResumoBackend(null)
                setCarrinho([])
                setCarrinhoAberto(false)
                setTimeout(() => {
                    setStatus('')
                    setCliente('Mesa ' + Math.floor(Math.random() * 100))
                }, 4000)
            }
        } catch {
            setStatus('❌ Erro no pagamento.')
        }
    }

    // ── Conteúdo do carrinho (compartilhado entre desktop e mobile) ──
    const CarrinhoConteudo = () => (
        <>
            <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-s)', flexShrink: 0 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--espresso)', marginBottom: '0.6rem' }}>
                    Pedido Atual
                </h2>
                <input className="input-base" value={cliente} onChange={e => setCliente(e.target.value)} style={{ fontWeight: 600 }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {pedidosProntos.length > 0 && (
                    <div style={{ marginBottom: carrinho.length > 0 ? '0.75rem' : 0 }}>
                        <button
                            onClick={() => setProntoExpandido(prev => !prev)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0.6rem', background: 'var(--forest-l)',
                                border: '1px solid #B8D8C4',
                                borderRadius: prontoExpandido ? 'var(--r-sm) var(--r-sm) 0 0' : 'var(--r-sm)',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--forest)', boxShadow: '0 0 6px var(--forest)' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--forest)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Prontos para entrega
                                </span>
                                <span style={{ background: 'var(--forest)', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                                    {pedidosProntos.length}
                                </span>
                            </div>
                            <span style={{ color: 'var(--forest)', fontSize: 12, transform: prontoExpandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
                        </button>
                        {prontoExpandido && (
                            <div style={{ border: '1px solid #B8D8C4', borderTop: 'none', borderRadius: '0 0 var(--r-sm) var(--r-sm)', overflow: 'hidden' }}>
                                {pedidosProntos.map((pedido, index) => (
                                    <div key={pedido.id} style={{ padding: '0.6rem 0.75rem', borderTop: index > 0 ? '1px solid #D4EAD8' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'white' }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--espresso)', marginBottom: 2 }}>{pedido.nome_cliente}</p>
                                            <p style={{ fontSize: 10, color: 'var(--mist)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pedido.item_preparado}</p>
                                        </div>
                                        <button
                                            onClick={() => entregarPedido(pedido.id)}
                                            style={{ flexShrink: 0, padding: '0.35rem 0.75rem', background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 7, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
                                        >
                                            Entregar ✓
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {carrinho.length === 0 && pedidosProntos.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.35 }}>
                        <ShoppingBasket size={36} color="var(--mist)" />
                        <p style={{ fontSize: 12, color: 'var(--mist)', fontWeight: 500 }}>Carrinho vazio</p>
                    </div>
                ) : (
                    carrinho.map(item => (
                        <div key={item.chaveUnica} style={{ display: 'flex', gap: '0.6rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border-s)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--steam)' }}>
                                <img src={item.imagem} alt={item.bebida_base} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--espresso)', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                        {item.bebida_base}
                                    </span>
                                    <button onClick={() => removerDoCarrinho(item.chaveUnica)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mist)', padding: 2, flexShrink: 0 }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--mist)'}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <p className="label-xs" style={{ marginTop: 1, marginBottom: 5 }}>
                                    {item.adicionais.length > 0 ? item.adicionais.join(' · ') : 'Original'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--chalk)', borderRadius: 7, padding: '2px 5px' }}>
                                        <button onClick={() => alterarQuantidade(item.chaveUnica, -1)} style={{ width: 20, height: 20, border: 'none', borderRadius: 5, background: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-s)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Minus size={10} />
                                        </button>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--espresso)', minWidth: 16, textAlign: 'center' }}>{item.quantidade}</span>
                                        <button onClick={() => alterarQuantidade(item.chaveUnica, 1)} style={{ width: 20, height: 20, border: 'none', borderRadius: 5, background: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-s)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--caramel)' }}>
                                        R$ {(item.precoUnitario * item.quantidade).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-s)', background: 'var(--chalk)', flexShrink: 0 }}>
                {!resumoBackend ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 500 }}>Subtotal estimado</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--espresso)' }}>
                                R$ {subtotalEstimado.toFixed(2)}
                            </span>
                        </div>
                        <button className="btn-primary" onClick={enviarParaCaixa} disabled={carrinho.length === 0}>
                            <CheckCircle size={15} /> Confirmar Pedido
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 500 }}>Total oficial</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--forest)' }}>
                                R$ {resumoBackend.total_a_pagar.toFixed(2)}
                            </span>
                        </div>
                        <div style={{ background: 'var(--amber-l)', border: '1px solid #E8C96A', borderRadius: 'var(--r-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
                            <p style={{ fontSize: 10, color: '#7A5C00', fontWeight: 500, lineHeight: 1.5 }}>
                                O pagamento é realizado <strong>no balcão</strong>. Selecione abaixo apenas para <strong>registrar a forma de entrada</strong>.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            {[
                                { metodo: 'pix', label: 'PIX', icon: <QrCode size={15} /> },
                                { metodo: 'cartao', label: 'Cartão', icon: <CreditCard size={15} /> },
                                { metodo: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={15} /> },
                            ].map(({ metodo, label, icon }) => (
                                <button key={metodo} onClick={() => pagarPedido(metodo)}
                                    style={{ padding: '0.6rem 0.25rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--espresso)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--caramel)'; e.currentTarget.style.color = 'var(--caramel)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--espresso)' }}
                                >
                                    {icon}{label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setResumoBackend(null)} style={{ width: '100%', border: 'none', background: 'none', fontSize: 11, fontWeight: 600, color: 'var(--mist)', cursor: 'pointer', padding: '0.3rem', transition: 'color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--espresso)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--mist)'}
                        >
                            ← Voltar para edição
                        </button>
                    </>
                )}
            </div>
        </>
    )

    return (
        <>
            {/* ── NOTIFICAÇÃO ── */}
            {notificacao && (
                <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--forest)', color: 'white', borderRadius: 'var(--r-lg)', padding: '0.85rem 1.5rem', boxShadow: '0 8px 32px rgba(30,74,48,.4)', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn .3s ease', maxWidth: 420, width: '90%' }}>
                    <Bell size={18} style={{ flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pedido pronto</p>
                        <p style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>PEDIDO DE: {notificacao.toUpperCase()} ESTÁ PRONTO! 🎉</p>
                    </div>
                    <button onClick={() => setNotificacao(null)} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(255,255,255,.15)', color: 'white', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
            )}

            {/* ════════════ LAYOUT MOBILE ════════════ */}
            {isMobile ? (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--chalk)', overflow: 'hidden' }}>

                    {/* Header mobile */}
                    <header style={{ background: 'white', borderBottom: '1px solid var(--border-s)', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 32, height: 32, background: 'var(--espresso)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Coffee size={15} color="var(--caramel)" />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--espresso)', lineHeight: 1 }}>Café Teria</h1>
                                <p className="label-xs" style={{ marginTop: 1, color: status.startsWith('✅') ? 'var(--forest)' : 'var(--mist)' }}>
                                    {status.startsWith('✅') ? '✅ Enviado para a cozinha!' : status || 'Atendente'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {/* Contadores condensados */}
                            {[
                                { valor: contagemStatus.fila, cor: 'var(--caramel)', bg: 'var(--caramel-l)' },
                                { valor: contagemStatus.preparo, cor: 'var(--amber)', bg: 'var(--amber-l)' },
                                { valor: contagemStatus.pronto, cor: 'var(--forest)', bg: 'var(--forest-l)' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: s.bg, borderRadius: 6, padding: '2px 7px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: s.cor }}>{s.valor}</span>
                                </div>
                            ))}

                            {/* Botão carrinho com badge */}
                            <button
                                onClick={() => setCarrinhoAberto(true)}
                                style={{ position: 'relative', width: 36, height: 36, background: 'var(--espresso)', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <ShoppingBasket size={16} color="var(--caramel)" />
                                {carrinho.length > 0 && (
                                    <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: 'var(--caramel)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                                        {carrinho.reduce((a, i) => a + i.quantidade, 0)}
                                    </div>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Busca + categorias mobile */}
                    <div style={{ background: 'white', borderBottom: '1px solid var(--border-s)', flexShrink: 0 }}>
                        <div style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--chalk)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.75rem' }}>
                                <Search size={13} color="var(--mist)" />
                                <input type="text" placeholder="Buscar produto..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                                    style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)', width: '100%' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 0.75rem' }}>
                            {CATEGORIAS.map(cat => (
                                <button key={cat.id} onClick={() => setCategoriaAtiva(cat.id)}
                                    style={{ padding: '0.5rem 0.85rem', border: 'none', borderBottom: `2.5px solid ${categoriaAtiva === cat.id ? 'var(--caramel)' : 'transparent'}`, background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: categoriaAtiva === cat.id ? 'var(--espresso)' : 'var(--mist)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid mobile */}
                    <main style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', alignContent: 'start' }}>
                        {produtosFiltrados.map(p => (
                            <ProdutoCard key={p.id} produto={p} onClick={() => abrirModal(p)} />
                        ))}
                    </main>

                    {/* Barra inferior mobile — subtotal + botão carrinho */}
                    {carrinho.length > 0 && !carrinhoAberto && (
                        <div style={{ background: 'var(--espresso)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>Subtotal</p>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--caramel)' }}>
                                    R$ {subtotalEstimado.toFixed(2)}
                                </p>
                            </div>
                            <button onClick={() => setCarrinhoAberto(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--caramel)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '0.6rem 1.1rem', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                                <ShoppingBasket size={15} />
                                Ver carrinho ({carrinho.reduce((a, i) => a + i.quantidade, 0)})
                            </button>
                        </div>
                    )}

                    {/* Bottom sheet do carrinho */}
                    {carrinhoAberto && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
                            {/* Overlay */}
                            <div onClick={() => setCarrinhoAberto(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(44,24,16,.5)' }} />
                            {/* Sheet */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {/* Handle */}
                                <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-s)', flexShrink: 0 }}>
                                    <div style={{ width: 32, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto' }} />
                                    <button onClick={() => setCarrinhoAberto(false)} style={{ position: 'absolute', right: 12, top: 10, border: 'none', background: 'var(--chalk)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={14} color="var(--mist)" />
                                    </button>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    {CarrinhoConteudo()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            ) : (

                /* ════════════ LAYOUT DESKTOP ════════════ */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 320px',
                    gridTemplateRows: 'auto auto auto 1fr',
                    gridTemplateAreas: `
                        "header  cart"
                        "status  cart"
                        "cats    cart"
                        "grid    cart"
                    `,
                    height: '100vh',
                    overflow: 'hidden',
                    background: 'var(--chalk)',
                }}>

                    {/* Header */}
                    <header style={{ gridArea: 'header', background: 'white', borderBottom: '1px solid var(--border-s)', padding: '0 1.25rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--espresso)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Café Teria</h1>
                            <p className="label-xs" style={{ marginTop: 2, color: status.startsWith('✅') ? 'var(--forest)' : 'var(--mist)', transition: 'color .3s' }}>
                                {status.startsWith('✅') ? '✅ Pedido registrado e enviado para a cozinha!' : status || 'Painel do Atendente'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--chalk)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.75rem', flex: 1, maxWidth: 240 }}>
                                <Search size={14} color="var(--mist)" />
                                <input type="text" placeholder="Buscar produto..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)', width: '100%' }} />
                            </div>
                            <div className="pill-online"><div className="pill-online-dot" />Ativo</div>
                        </div>
                    </header>

                    {/* Status cozinha */}
                    <div style={{ gridArea: 'status', background: 'white', borderBottom: '1px solid var(--border-s)', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="label-xs" style={{ marginRight: '0.25rem', whiteSpace: 'nowrap' }}>Cozinha</span>
                        {[
                            { label: 'Na fila', valor: contagemStatus.fila, cor: 'var(--caramel)', bg: 'var(--caramel-l)' },
                            { label: 'Em preparo', valor: contagemStatus.preparo, cor: 'var(--amber)', bg: 'var(--amber-l)' },
                            { label: 'Prontos', valor: contagemStatus.pronto, cor: 'var(--forest)', bg: 'var(--forest-l)' },
                        ].map(({ label, valor, cor, bg }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: bg, borderRadius: 7, padding: '0.25rem 0.65rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: cor }}>{valor}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: cor, opacity: 0.8 }}>{label}</span>
                            </div>
                        ))}
                        <button onClick={() => exibirNotificacao('Mesa 07')} style={{ marginLeft: 'auto', border: '1px solid var(--border)', background: 'white', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: 10, fontWeight: 600, color: 'var(--mist)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bell size={11} /> Demo notificação
                        </button>
                    </div>

                    {/* Categorias */}
                    <nav style={{ gridArea: 'cats', background: 'white', borderBottom: '1px solid var(--border-s)', padding: '0 1.25rem', display: 'flex', overflowX: 'auto' }}>
                        {CATEGORIAS.map(cat => (
                            <button key={cat.id} onClick={() => setCategoriaAtiva(cat.id)}
                                style={{ padding: '0.6rem 1rem', border: 'none', borderBottom: `2.5px solid ${categoriaAtiva === cat.id ? 'var(--caramel)' : 'transparent'}`, background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: categoriaAtiva === cat.id ? 'var(--espresso)' : 'var(--mist)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </nav>

                    {/* Grid */}
                    <main style={{ gridArea: 'grid', overflowY: 'auto', padding: '0.9rem 1.1rem', background: 'var(--chalk)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', alignContent: 'start' }}>
                        {produtosFiltrados.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', opacity: 0.4 }}>
                                <span style={{ fontSize: 36 }}>☕</span>
                                <p style={{ fontSize: 13, color: 'var(--mist)', fontWeight: 500 }}>Nenhum produto encontrado</p>
                            </div>
                        ) : (
                            produtosFiltrados.map(p => (
                                <ProdutoCard key={p.id} produto={p} onClick={() => abrirModal(p)} />
                            ))
                        )}
                    </main>

                    {/* Carrinho desktop */}
                    <aside style={{ gridArea: 'cart', background: 'white', borderLeft: '1px solid var(--border-s)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {CarrinhoConteudo()}
                    </aside>
                </div>
            )}

            {/* ── MODAL DE CUSTOMIZAÇÃO ── */}
            {modalAberto && produtoModal && (
                <div onClick={() => setModalAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(44,24,16,.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div onClick={e => e.stopPropagation()} className="animate-fade-in"
                        style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: 'var(--shadow-l)' }}>
                        <div style={{ height: 160, position: 'relative', background: 'var(--steam)' }}>
                            <img src={produtoModal.imagem_url || getImagem(produtoModal.categoria)} alt={produtoModal.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(44,24,16,.7) 0%, transparent 60%)' }} />
                            <button onClick={() => setModalAberto(false)} style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>{produtoModal.nome}</h3>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Base: R$ {produtoModal.preco.toFixed(2)}</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            {(produtoModal.categoria === 'cafe' || produtoModal.categoria === 'suco') && (
                                <div style={{ marginBottom: '1.1rem' }}>
                                    <p className="label-xs" style={{ marginBottom: '0.5rem' }}>Tamanho</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['pequeno', 'médio', 'grande'].map(t => (
                                            <button key={t} onClick={() => setTamanhoSelecionado(t)}
                                                style={{ flex: 1, padding: '0.5rem', border: `2px solid ${tamanhoSelecionado === t ? 'var(--caramel)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', background: tamanhoSelecionado === t ? 'var(--caramel-l)' : 'white', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: tamanhoSelecionado === t ? 'var(--roast)' : 'var(--mist)', cursor: 'pointer', transition: 'all .15s' }}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {todosProdutos.filter(p => p.categoria === `adicional_${produtoModal.categoria}`).length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p className="label-xs" style={{ marginBottom: '0.5rem' }}>Adicionais</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                        {todosProdutos.filter(p => p.categoria === `adicional_${produtoModal.categoria}`).map(adic => (
                                            <button key={adic.id} onClick={() => toggleAdicional(adic.nome)}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', border: `2px solid ${adicionaisModal.includes(adic.nome) ? 'var(--caramel)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', background: adicionaisModal.includes(adic.nome) ? 'var(--caramel-l)' : 'white', cursor: 'pointer', transition: 'all .15s' }}
                                            >
                                                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: adicionaisModal.includes(adic.nome) ? 'var(--roast)' : 'var(--mist)' }}>{adic.nome}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: adicionaisModal.includes(adic.nome) ? 'var(--caramel)' : 'var(--mist)' }}>+ R$ {adic.preco.toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button className="btn-primary" onClick={adicionarAoCarrinho}>
                                <Plus size={15} /> Adicionar — R$ {calcularPrecoModal().toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}