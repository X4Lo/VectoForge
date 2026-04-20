const ENGINE_CONTROLS = {
  metal: {
    detail_level: { label: 'Detail Level', min: 1, max: 10, default: 10, hint: 'Path precision — higher = more nodes' },
    color_count: null,
    corner_sharpness: { label: 'Corner Sharpness', min: 1, max: 100, default: 80, hint: 'Higher = spikier corners preserved' },
  },
  anime: {
    detail_level: { label: 'Detail Level', min: 1, max: 10, default: 6, hint: 'Path precision' },
    color_count: { label: 'Color Count', min: 2, max: 32, default: 24, hint: 'Number of quantized colors (16–32 for gradients)' },
    corner_sharpness: { label: 'Corner Sharpness', min: 1, max: 100, default: 40, hint: 'Lower = smoother curves' },
  },
  logo: {
    detail_level: { label: 'Simplification', min: 1, max: 10, default: 3, hint: 'Lower = fewer nodes for cutting plotters' },
    color_count: { label: 'Color Count', min: 2, max: 16, default: 6, hint: 'Reduce for clean vinyl layers' },
    corner_sharpness: { label: 'Corner Sharpness', min: 1, max: 100, default: 40, hint: 'Higher = more angular cuts' },
  },
}

export default function ControlPanel({ engine, overrides, setOverrides }) {
  const controls = ENGINE_CONTROLS[engine]

  const handleSlider = (key, value, ctrl) => {
    setOverrides((prev) => ({ ...prev, [key]: value === ctrl.default ? null : value }))
  }

  const getDisplayValue = (key, ctrl) => {
    return overrides[key] !== null && overrides[key] !== undefined ? overrides[key] : ctrl.default
  }

  return (
    <div className="control-panel">
      <p className="section-label">// MANUAL OVERRIDES</p>
      <p className="control-hint-global">Sliders are pre-set to engine defaults. Adjust to override.</p>

      {Object.entries(controls).map(([key, ctrl]) => {
        if (!ctrl) return null
        const val = getDisplayValue(key, ctrl)
        const isOverridden = overrides[key] !== null && overrides[key] !== undefined

        return (
          <div key={key} className={`slider-group ${isOverridden ? 'overridden' : ''}`}>
            <div className="slider-header">
              <span className="slider-label">{ctrl.label}</span>
              <span className="slider-value">
                {val}
                {isOverridden && <span className="override-tag">custom</span>}
              </span>
            </div>
            <input
              type="range"
              min={ctrl.min}
              max={ctrl.max}
              value={val}
              className="slider"
              onChange={(e) => handleSlider(key, parseInt(e.target.value), ctrl)}
            />
            <p className="slider-hint">{ctrl.hint}</p>
          </div>
        )
      })}

      <button
        className="btn-reset"
        onClick={() => setOverrides({ detail_level: null, color_count: null, corner_sharpness: null })}
      >
        ↺ Reset to Engine Defaults
      </button>
    </div>
  )
}
