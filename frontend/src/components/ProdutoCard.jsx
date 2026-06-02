export default function ProdutoCard({ produto, onClick }) {
  const getImagem = (categoria) => {
    if (categoria === 'cafe')   return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop'
    if (categoria === 'suco')   return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop'
    if (categoria === 'comida') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop'
    return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop'
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-s)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-s)',
        transition: 'all .18s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-m)'
        e.currentTarget.style.borderColor = 'var(--caramel)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = 'var(--shadow-s)'
        e.currentTarget.style.borderColor = 'var(--border-s)'
      }}
    >
      {/* Imagem */}
      <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: 'var(--steam)', flexShrink: 0 }}>
        <img
          src={produto.imagem_url || getImagem(produto.categoria)}
          alt={produto.nome}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', top: 7, right: 7,
          background: 'rgba(44,24,16,.82)',
          backdropFilter: 'blur(3px)',
          color: '#F5C97A',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          R$ {produto.preco.toFixed(2)}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0.6rem 0.7rem' }}>
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: 'var(--espresso)',
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {produto.nome}
        </div>
        <div className="label-xs">
          {produto.categoria === 'comida' ? 'Pronto' : 'Customizável'}
        </div>
      </div>
    </div>
  )
}