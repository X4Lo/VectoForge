import { useRef, useState } from 'react'

export default function PreviewPanel({ imagePreviewUrl, svgContent, onFileDrop }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileDrop(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) onFileDrop(file)
  }

  const svgDataUrl = svgContent
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
    : null

  return (
    <div className="preview-panel">
      {/* Original PNG panel */}
      <div
        className={`preview-pane ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !imagePreviewUrl && inputRef.current?.click()}
      >
        <p className="pane-label">// ORIGINAL PNG</p>
        {imagePreviewUrl ? (
          <>
            <img src={imagePreviewUrl} alt="Source" className="preview-img" />
            <button className="replace-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
              Replace Image
            </button>
          </>
        ) : (
          <div className="drop-placeholder">
            <span className="drop-icon">⬆</span>
            <p>Drop PNG / JPEG here</p>
            <p className="drop-sub">or click to browse</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* SVG result panel */}
      <div className="preview-pane">
        <p className="pane-label">// SVG OUTPUT</p>
        {svgContent ? (
          <img src={svgDataUrl} alt="SVG output" className="preview-img" />
        ) : (
          <div className="drop-placeholder muted">
            <span className="drop-icon">⬡</span>
            <p>SVG preview will appear here</p>
            <p className="drop-sub">Select an engine and click Vectorize</p>
          </div>
        )}
      </div>
    </div>
  )
}
