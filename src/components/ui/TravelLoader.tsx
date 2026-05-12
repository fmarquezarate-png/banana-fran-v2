import { useState, useEffect, useRef } from 'react'

const EMOJIS = ['✈️', '🌍', '🗺️', '🧳', '🏖️', '🏔️', '🗼', '🌴', '🚢', '⛵', '🎒', '🌅', '🍹', '🌊', '🏄', '🧭']

const MESSAGES = [
  'Explorando el mundo…',
  'Consultando el mapa…',
  'Preparando tu aventura…',
  'Buscando destinos perfectos…',
  'Calculando rutas…',
  'Cargando experiencias…',
  'Soñando con el próximo viaje…',
]

interface Props {
  onDone: () => void
  /** ms — defaults to random 2000-5000 */
  duration?: number
}

export function TravelLoader({ onDone, duration }: Props) {
  const [emojiIdx, setEmojiIdx] = useState(() => Math.floor(Math.random() * EMOJIS.length))
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
  const [fading, setFading] = useState(false)
  const dur = useRef(duration ?? Math.random() * 3000 + 2000)

  useEffect(() => {
    const fadeAt = Math.max(dur.current - 450, 0)
    const t1 = setTimeout(() => setFading(true), fadeAt)
    const t2 = setTimeout(onDone, dur.current)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  useEffect(() => {
    const t = setInterval(() => setEmojiIdx(i => (i + 1) % EMOJIS.length), 430)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center"
      style={{ transition: 'opacity 0.45s ease', opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="text-6xl select-none" style={{ animation: 'bounce 0.8s infinite' }}>
        {EMOJIS[emojiIdx]}
      </div>
      <p className="text-gray-400 text-sm font-medium mt-5">{msg}</p>
    </div>
  )
}
