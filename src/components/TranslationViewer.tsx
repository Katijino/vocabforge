import { useState } from 'react'

function splitSentences(text: string): string[] {
  return text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) ?? [text]
}

interface TranslationViewerProps {
  translation: string
  hoveredSentenceIdx?: number | null
}

export default function TranslationViewer({ translation, hoveredSentenceIdx }: TranslationViewerProps) {
  const [directHover, setDirectHover] = useState<number | null>(null)
  const sentences = splitSentences(translation)

  return (
    <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>
      {sentences.map((sentence, i) => {
        const revealed = directHover === i || hoveredSentenceIdx === i
        return (
          <span
            key={i}
            onMouseEnter={() => setDirectHover(i)}
            onMouseLeave={() => setDirectHover(null)}
            onClick={() => setDirectHover(directHover === i ? null : i)}
            style={{
              filter: revealed ? 'none' : 'blur(5px)',
              transition: 'filter 0.15s ease',
              cursor: 'default',
              userSelect: revealed ? 'text' : 'none',
            }}
          >
            {sentence}
          </span>
        )
      })}
    </p>
  )
}
