import { useState } from 'react'

function splitSentences(text: string): string[] {
  return text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) ?? [text]
}

interface TranslationViewerProps {
  translation: string
  hoveredSentenceIdx?: number | null
  showAll?: boolean
}

export default function TranslationViewer({ translation, hoveredSentenceIdx, showAll = false }: TranslationViewerProps) {
  const [directHover, setDirectHover] = useState<number | null>(null)
  const sentences = splitSentences(translation)

  return (
    <div style={{ fontSize: '1.05rem' }}>
      {sentences.map((sentence, i) => {
        const revealed = showAll || directHover === i || hoveredSentenceIdx === i
        return (
          <div
            key={i}
            onMouseEnter={() => setDirectHover(i)}
            onMouseLeave={() => setDirectHover(null)}
            onClick={() => setDirectHover(directHover === i ? null : i)}
            style={{
              filter: revealed ? 'none' : 'blur(5px)',
              transition: 'filter 0.2s ease',
              cursor: 'default',
              userSelect: revealed ? 'text' : 'none',
              lineHeight: 2,
              padding: '0.15rem 0.4rem',
              color: '#94a3b8',
            }}
          >
            {sentence}
          </div>
        )
      })}
    </div>
  )
}
