import { useRef, useState, useCallback } from 'react'

interface ImportDropzoneProps {
  accept: string
  onFile: (file: File) => void
  hint?: string
}

export default function ImportDropzone({ accept, onFile, hint }: ImportDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
        borderRadius: 16,
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
        {dragging ? 'Drop it here' : 'Drop file here or click to browse'}
      </p>
      {hint && <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>{hint}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInput}
        style={{ display: 'none' }}
      />
    </div>
  )
}
