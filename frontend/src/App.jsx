import { useState, useCallback } from 'react'
import EngineSelector from './components/EngineSelector'
import PreviewPanel from './components/PreviewPanel'
import ControlPanel from './components/ControlPanel'
import './App.css'

const API_BASE = ''

export default function App() {
  const [engine, setEngine] = useState('metal')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [svgContent, setSvgContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [overrides, setOverrides] = useState({
    detail_level: null,
    color_count: null,
    corner_sharpness: null,
  })

  const handleFileDrop = useCallback((file) => {
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setSvgContent(null)
    setError(null)
  }, [])

  const handleVectorize = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    setSvgContent(null)

    const form = new FormData()
    form.append('file', imageFile)
    form.append('engine', engine)
    if (overrides.detail_level !== null) form.append('detail_level', overrides.detail_level)
    if (overrides.color_count !== null) form.append('color_count', overrides.color_count)
    if (overrides.corner_sharpness !== null) form.append('corner_sharpness', overrides.corner_sharpness)

    try {
      const res = await fetch(`${API_BASE}/vectorize`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error ${res.status}`)
      }
      const text = await res.text()
      setSvgContent(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vector_${engine}_${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-block">
            <span className="logo-icon">⬡</span>
            <div>
              <h1 className="logo-title">VECTO<span className="accent">FORGE</span></h1>
              <p className="logo-sub">Professional Print Vectorization</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge">Metal Art</span>
            <span className="badge">Anime / DTF</span>
            <span className="badge">Vinyl Ready</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <EngineSelector selected={engine} onSelect={setEngine} />
          <ControlPanel engine={engine} overrides={overrides} setOverrides={setOverrides} />
          <button
            className="btn-vectorize"
            onClick={handleVectorize}
            disabled={!imageFile || loading}
          >
            {loading ? (
              <span className="btn-loading"><span className="spinner" />Processing…</span>
            ) : (
              '⚡ Vectorize'
            )}
          </button>
          {error && <div className="error-box">{error}</div>}
        </aside>

        <section className="preview-area">
          <PreviewPanel
            imagePreviewUrl={imagePreviewUrl}
            svgContent={svgContent}
            onFileDrop={handleFileDrop}
          />
        </section>
      </main>

      {svgContent && (
        <div className="download-bar">
          <span className="download-label">SVG ready — {(new Blob([svgContent]).size / 1024).toFixed(1)} KB</span>
          <button className="btn-download" onClick={handleDownload}>
            ↓ Download SVG
          </button>
        </div>
      )}
    </div>
  )
}
