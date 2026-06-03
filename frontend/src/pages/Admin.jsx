import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, ArrowLeft, Plus, Pencil, Upload, X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORIAS_PRODUTO = [
    { valor: 'cafe', label: 'Café' },
    { valor: 'suco', label: 'Suco' },
    { valor: 'comida', label: 'Comida' },
]

const FILTROS = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'cafe', label: 'Cafés' },
    { valor: 'suco', label: 'Sucos' },
    { valor: 'comida', label: 'Comidas' },
    { valor: 'adicional_cafe', label: 'Ad. Café' },
    { valor: 'adicional_suco', label: 'Ad. Suco' },
    { valor: 'adicional_tamanho', label: 'Tamanhos' },
]

const BADGE_CORES = {
    cafe: { bg: '#FFF0E0', color: '#7A4010' },
    suco: { bg: '#E8F5E0', color: '#2A6010' },
    comida: { bg: '#EEF0F5', color: '#3A4060' },
    adicional_cafe: { bg: '#F5EEF8', color: '#60307A' },
    adicional_suco: { bg: '#EEF8F0', color: '#206040' },
    adicional_tamanho: { bg: '#EEF5F5', color: '#206060' },
}

const FORM_VAZIO = {
    nome: '',
    preco: '',
    categoria: 'cafe',
    adicionais_selecionados: [],
}

export default function Admin() {
    const navigate = useNavigate()

    const [produtos, setProdutos] = useState([])
    const [filtroAtivo, setFiltroAtivo] = useState('todos')
    const [formAberto, setFormAberto] = useState(false)
    const [form, setForm] = useState(FORM_VAZIO)
    const [editandoId, setEditandoId] = useState(null)
    const [imagemFile, setImagemFile] = useState(null)
    const [imagemPreview, setImagemPreview] = useState(null)
    const [salvando, setSalvando] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [navAtiva, setNavAtiva] = useState('produtos')

    // ── Busca produtos ────────────────────────────────────────
    const buscarProdutos = async () => {
        try {
            const resposta = await fetch(`${API_URL}/cardapio`)
            const data = await resposta.json()
            if (resposta.ok && data.dados) setProdutos(data.dados)
        } catch {
            mostrarFeedback('Erro ao carregar produtos.', 'erro')
        }
    }

    useEffect(() => { buscarProdutos() }, [])

    // ── Feedback temporário ───────────────────────────────────
    const mostrarFeedback = (msg, tipo = 'ok') => {
        setFeedback({ msg, tipo })
        setTimeout(() => setFeedback(null), 3500)
    }

    // ── Imagem ────────────────────────────────────────────────
    const handleImagem = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImagemFile(file)
        setImagemPreview(URL.createObjectURL(file))
    }

    const uploadImagem = async () => {
        if (!imagemFile) return null
        const formData = new FormData()
        formData.append('arquivo', imagemFile)
        const resposta = await fetch(`${API_URL}/produtos/upload-imagem`, {
            method: 'POST',
            body: formData,
        })
        if (!resposta.ok) throw new Error('Erro no upload da imagem.')
        const data = await resposta.json()
        return data.url
    }

    // ── Abrir form ────────────────────────────────────────────
    const abrirNovo = () => {
        setForm(FORM_VAZIO)
        setEditandoId(null)
        setImagemFile(null)
        setImagemPreview(null)
        setFormAberto(true)
    }

    const abrirEditar = (produto) => {
        setForm({
            nome: produto.nome,
            preco: String(produto.preco),
            categoria: produto.categoria,
            adicionais_selecionados: [],
        })
        setEditandoId(produto.id)
        setImagemFile(null)
        setImagemPreview(produto.imagem_url || null)
        setFormAberto(true)
    }

    const fecharForm = () => {
        setFormAberto(false)
        setEditandoId(null)
        setForm(FORM_VAZIO)
        setImagemFile(null)
        setImagemPreview(null)
    }

    // ── Salvar produto ────────────────────────────────────────
    const salvarProduto = async () => {
        if (!form.nome.trim() || !form.preco) {
            mostrarFeedback('Preencha nome e preço.', 'erro')
            return
        }

        setSalvando(true)
        try {
            let imagem_url = imagemPreview

            if (imagemFile) {
                imagem_url = await uploadImagem()
            }

            const payload = {
                nome: form.nome.trim().toLowerCase(),
                preco: parseFloat(form.preco.replace(',', '.')),
                categoria: form.categoria,
                imagem_url,
            }

            if (editandoId) {
                const resposta = await fetch(`${API_URL}/produtos/${editandoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!resposta.ok) throw new Error('Erro ao editar produto.')
                mostrarFeedback(`"${payload.nome}" atualizado com sucesso!`)
            } else {
                const resposta = await fetch(`${API_URL}/produtos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!resposta.ok) throw new Error('Erro ao criar produto.')
                mostrarFeedback(`"${payload.nome}" adicionado ao cardápio!`)
            }

            await buscarProdutos()
            fecharForm()
        } catch (e) {
            mostrarFeedback(e.message || 'Erro ao salvar.', 'erro')
        } finally {
            setSalvando(false)
        }
    }

    // ── Adicionais disponíveis para o produto sendo cadastrado ──
    const adicionaisDisponiveis = produtos.filter(p =>
        p.categoria === `adicional_${form.categoria}`
    )

    const toggleAdicional = (nome) => {
        setForm(prev => ({
            ...prev,
            adicionais_selecionados: prev.adicionais_selecionados.includes(nome)
                ? prev.adicionais_selecionados.filter(a => a !== nome)
                : [...prev.adicionais_selecionados, nome],
        }))
    }

    // ── Produtos filtrados ────────────────────────────────────
    const produtosFiltrados = filtroAtivo === 'todos'
        ? produtos
        : produtos.filter(p => p.categoria === filtroAtivo)

    const getImagem = (categoria) => {
        if (categoria === 'cafe') return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=80&h=80&fit=crop'
        if (categoria === 'suco') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=80&h=80&fit=crop'
        if (categoria === 'comida') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=80&h=80&fit=crop'
        return null
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <div style={{
            height: '100vh',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gridTemplateRows: '1fr',
            overflow: 'hidden',
            background: 'var(--chalk)',
        }}>

            {/* ── SIDEBAR ── */}
            <aside style={{
                background: 'var(--espresso)',
                display: 'flex', flexDirection: 'column',
                padding: '1.25rem 0.9rem',
                overflow: 'hidden',
            }}>
                {/* Brand */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    marginBottom: '1.75rem',
                    paddingBottom: '1.1rem',
                    borderBottom: '1px solid rgba(255,255,255,.08)',
                }}>
                    <div style={{
                        width: 34, height: 34,
                        background: 'var(--caramel)',
                        borderRadius: 'var(--r-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Coffee size={15} color="white" />
                    </div>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.1,
                        }}>
                            Café Teria
                        </div>
                        <div style={{
                            fontSize: 9, color: 'rgba(255,255,255,.35)',
                            fontWeight: 500, letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            Gerente
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1 }}>
                    {[
                        { id: 'produtos', icon: '▦', label: 'Produtos' },
                        { id: 'pedidos', icon: '📋', label: 'Pedidos' },
                        { id: 'relatorios', icon: '📈', label: 'Relatórios' },
                        { id: 'usuarios', icon: '👥', label: 'Usuários' },
                        { id: 'config', icon: '⚙', label: 'Config' },
                    ].map(item => (
                        <div
                            key={item.id}
                            onClick={() => setNavAtiva(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.55rem 0.7rem',
                                borderRadius: 'var(--r-sm)',
                                cursor: 'pointer',
                                color: navAtiva === item.id ? 'var(--caramel)' : 'rgba(255,255,255,.4)',
                                background: navAtiva === item.id ? 'rgba(192,123,62,.18)' : 'transparent',
                                fontSize: 12, fontWeight: 500,
                                marginBottom: 2,
                                transition: 'all .15s',
                            }}
                        >
                            <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </div>
                    ))}
                </nav>

                {/* Voltar para PDV */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.55rem 0.7rem',
                        borderRadius: 'var(--r-sm)',
                        border: 'none',
                        background: 'rgba(255,255,255,.05)',
                        color: 'rgba(255,255,255,.4)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', transition: 'all .15s', width: '100%',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}
                >
                    <ArrowLeft size={13} />
                    Voltar ao PDV
                </button>
            </aside>

            {/* ── ÁREA PRINCIPAL ── */}
            <main style={{
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>

                {/* Topbar */}
                <div style={{
                    background: 'white',
                    borderBottom: '1px solid var(--border-s)',
                    padding: '0.7rem 1.25rem',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '0.75rem',
                    flexShrink: 0,
                }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17, fontWeight: 600, color: 'var(--espresso)',
                    }}>
                        Gestão de Produtos
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Feedback */}
                        {feedback && (
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                color: feedback.tipo === 'erro' ? 'var(--red)' : 'var(--forest)',
                                animation: 'fadeIn .2s ease',
                            }}>
                                {feedback.tipo === 'erro' ? '❌' : '✅'} {feedback.msg}
                            </span>
                        )}

                        <button
                            onClick={abrirNovo}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: 11 }}
                        >
                            <Plus size={13} />
                            Novo Produto
                        </button>
                    </div>
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Lista de produtos */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>

                        {/* Filtros */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {FILTROS.map(f => (
                                <button
                                    key={f.valor}
                                    onClick={() => setFiltroAtivo(f.valor)}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: 7,
                                        border: '1px solid var(--border)',
                                        background: filtroAtivo === f.valor ? 'var(--espresso)' : 'white',
                                        color: filtroAtivo === f.valor ? 'var(--caramel)' : 'var(--mist)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 10, fontWeight: 700,
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                        cursor: 'pointer', transition: 'all .15s',
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Tabela */}
                        <div style={{
                            background: 'white',
                            borderRadius: 'var(--r-lg)',
                            border: '1px solid var(--border-s)',
                            overflow: 'hidden',
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 1fr 90px 140px 42px',
                                padding: '0.6rem 1rem',
                                background: 'var(--chalk)',
                                borderBottom: '1px solid var(--border-s)',
                            }}>
                                {['', 'Produto', 'Preço', 'Categoria', ''].map((h, i) => (
                                    <span key={i} style={{
                                        fontSize: 9, fontWeight: 700,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        color: 'var(--mist)',
                                    }}>
                                        {h}
                                    </span>
                                ))}
                            </div>

                            {/* Linhas */}
                            {produtosFiltrados.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mist)', fontSize: 12 }}>
                                    Nenhum produto encontrado
                                </div>
                            ) : (
                                produtosFiltrados.map(p => {
                                    const badge = BADGE_CORES[p.categoria] || { bg: '#EEE', color: '#666' }
                                    return (
                                        <div
                                            key={p.id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '48px 1fr 90px 140px 42px',
                                                padding: '0.65rem 1rem',
                                                borderBottom: '1px solid var(--border-s)',
                                                alignItems: 'center',
                                                transition: 'background .1s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--chalk)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                            onClick={() => abrirEditar(p)}
                                        >
                                            {/* Imagem */}
                                            <div style={{
                                                width: 34, height: 34,
                                                borderRadius: 7, overflow: 'hidden',
                                                background: 'var(--steam)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 16,
                                            }}>
                                                {p.imagem_url
                                                    ? <img src={p.imagem_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : getImagem(p.categoria)
                                                        ? <img src={getImagem(p.categoria)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : '🍽'
                                                }
                                            </div>

                                            {/* Nome */}
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--espresso)', textTransform: 'capitalize' }}>
                                                    {p.nome}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--mist)' }}>
                                                    {p.categoria.startsWith('adicional') ? 'Adicional' : 'Customizável'}
                                                </div>
                                            </div>

                                            {/* Preço */}
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 12, color: 'var(--espresso)',
                                            }}>
                                                R$ {Number(p.preco).toFixed(2)}
                                            </div>

                                            {/* Badge categoria */}
                                            <div>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    padding: '2px 8px',
                                                    borderRadius: 5,
                                                    fontSize: 9, fontWeight: 700,
                                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                                    background: badge.bg, color: badge.color,
                                                }}>
                                                    {p.categoria.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Ícone editar */}
                                            <div style={{
                                                width: 26, height: 26,
                                                borderRadius: 6, border: '1px solid var(--border)',
                                                background: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Pencil size={11} color="var(--mist)" />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* ── PAINEL DE FORMULÁRIO ── */}
                    {formAberto && (
                        <div style={{
                            width: 290, flexShrink: 0,
                            background: 'white',
                            borderLeft: '1px solid var(--border-s)',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}>
                            {/* Header do form */}
                            <div style={{
                                padding: '0.9rem 1rem',
                                borderBottom: '1px solid var(--border-s)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexShrink: 0,
                            }}>
                                <div>
                                    <h3 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 15, fontWeight: 600, color: 'var(--espresso)',
                                    }}>
                                        {editandoId ? 'Editar Produto' : 'Novo Produto'}
                                    </h3>
                                    <p style={{ fontSize: 11, color: 'var(--mist)', marginTop: 2 }}>
                                        {editandoId ? 'Altere os dados abaixo' : 'Preencha os dados do novo item'}
                                    </p>
                                </div>
                                <button
                                    onClick={fecharForm}
                                    style={{
                                        border: 'none', background: 'var(--chalk)',
                                        borderRadius: 6, width: 26, height: 26,
                                        cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={13} color="var(--mist)" />
                                </button>
                            </div>

                            {/* Conteúdo do form */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

                                {/* Upload de imagem */}
                                <label style={{ cursor: 'pointer', display: 'block', marginBottom: '1rem' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImagem}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        border: `2px dashed ${imagemPreview ? 'var(--caramel)' : 'var(--border)'}`,
                                        borderRadius: 'var(--r-md)',
                                        height: 110,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: '0.35rem',
                                        background: imagemPreview ? 'var(--caramel-l)' : 'var(--chalk)',
                                        overflow: 'hidden', position: 'relative',
                                        transition: 'all .2s',
                                    }}>
                                        {imagemPreview ? (
                                            <img
                                                src={imagemPreview}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                            />
                                        ) : (
                                            <>
                                                <Upload size={20} color="var(--mist)" />
                                                <span style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 500 }}>
                                                    Clique para enviar foto
                                                </span>
                                                <span style={{ fontSize: 9, color: 'var(--border)' }}>
                                                    JPG, PNG · Máx. 2MB
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </label>

                                {/* Nome */}
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '0.3rem' }}>
                                        Nome do produto
                                    </label>
                                    <input
                                        className="input-base"
                                        placeholder="Ex: Mocha Gelado"
                                        value={form.nome}
                                        onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                                    />
                                </div>

                                {/* Preço */}
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '0.3rem' }}>
                                        Preço base (R$)
                                    </label>
                                    <input
                                        className="input-base"
                                        placeholder="0,00"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.preco}
                                        onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))}
                                    />
                                </div>

                                {/* Categoria */}
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <label className="label-xs" style={{ display: 'block', marginBottom: '0.3rem' }}>
                                        Categoria
                                    </label>
                                    <select
                                        className="input-base"
                                        value={form.categoria}
                                        onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value, adicionais_selecionados: [] }))}
                                        style={{ appearance: 'none', cursor: 'pointer' }}
                                    >
                                        {CATEGORIAS_PRODUTO.map(c => (
                                            <option key={c.valor} value={c.valor}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Adicionais disponíveis */}
                                {adicionaisDisponiveis.length > 0 && (
                                    <div style={{ marginBottom: '0.85rem' }}>
                                        <label className="label-xs" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Adicionais disponíveis
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                            {adicionaisDisponiveis.map(adic => {
                                                const selecionado = form.adicionais_selecionados.includes(adic.nome)
                                                return (
                                                    <button
                                                        key={adic.id}
                                                        onClick={() => toggleAdicional(adic.nome)}
                                                        style={{
                                                            padding: '0.4rem 0.5rem',
                                                            border: `1.5px solid ${selecionado ? 'var(--caramel)' : 'var(--border)'}`,
                                                            borderRadius: 8,
                                                            background: selecionado ? 'var(--caramel-l)' : 'white',
                                                            fontFamily: 'var(--font-body)',
                                                            fontSize: 10, fontWeight: 600,
                                                            color: selecionado ? 'var(--roast)' : 'var(--mist)',
                                                            cursor: 'pointer', textAlign: 'center',
                                                            textTransform: 'capitalize',
                                                            transition: 'all .15s',
                                                        }}
                                                    >
                                                        {adic.nome}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Botão salvar */}
                            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-s)', flexShrink: 0 }}>
                                <button
                                    className="btn-primary"
                                    onClick={salvarProduto}
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar ao cardápio'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}