const ENGINES = [
  {
    id: 'metal',
    name: 'Metal Engine',
    icon: '⚙',
    badge: 'Color · Spline · Ultra-Detail',
    description: 'Monochrome with sharp spikes. Optimized for laser-cut metal art.',
  },
  {
    id: 'anime',
    name: 'Anime Engine',
    icon: '✦',
    badge: 'Color · Stacked · Gradients',
    description: 'Hierarchical color stacking with cel-shading. Perfect for DTF prints.',
  },
  {
    id: 'logo',
    name: 'Logo Engine',
    icon: '◈',
    badge: 'Polygon · Low-Node · Vinyl',
    description: 'Simplified paths with minimal nodes. Optimized for vinyl cutting plotters.',
  },
]

export default function EngineSelector({ selected, onSelect }) {
  return (
    <div className="engine-selector">
      <p className="section-label">// SELECT ENGINE</p>
      {ENGINES.map((eng) => (
        <button
          key={eng.id}
          className={`engine-card ${selected === eng.id ? 'active' : ''}`}
          onClick={() => onSelect(eng.id)}
        >
          <div className="engine-card-top">
            <span className="engine-icon">{eng.icon}</span>
            <div className="engine-info">
              <span className="engine-name">{eng.name}</span>
              <span className="engine-badge">{eng.badge}</span>
            </div>
            {selected === eng.id && <span className="engine-check">✓</span>}
          </div>
          <p className="engine-desc">{eng.description}</p>
        </button>
      ))}
    </div>
  )
}
