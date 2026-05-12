import { useState, useEffect, useRef } from 'react'

const EMOJIS = ['✈️', '🌍', '🗺️', '🧳', '🏖️', '🏔️', '🗼', '🌴', '🚢', '⛵', '🎒', '🌅', '🍹', '🌊', '🏄', '🧭']

const NAV_MESSAGES = [
  'Preparando tu aventura…',
  'Cargando el mapa…',
  'Un momento…',
  'Explorando…',
]

const QUIZ_MESSAGES = [
  'Analizando el clima para tus fechas…',
  'Revisando la demanda turística del destino…',
  'Comprobando los restaurantes recomendados de la zona…',
  'Calculando el presupuesto ideal para vuestro viaje…',
  'Buscando los mejores hoteles según vuestras preferencias…',
  'Revisando las actividades disponibles en la zona…',
  'Consultando el nivel de masificación en temporada…',
  'Analizando las rutas de vuelo más convenientes…',
  'Comprobando qué idiomas se hablan en el destino…',
  'Revisando las valoraciones de otros viajeros…',
  'Calculando la afinidad con tu perfil de viajero…',
  'Buscando experiencias únicas para vuestro estilo…',
  'Analizando el transporte local disponible…',
  'Revisando las mejores épocas para visitar…',
  'Comprobando la seguridad y consejos de viaje…',
  'Buscando playas, montañas y rincones secretos…',
  'Revisando los precios en temporada para las fechas elegidas…',
  'Consultando las rutas populares y las menos turísticas…',
  'Analizando la gastronomía local según vuestros gustos…',
  'Preparando vuestro ranking personalizado de destinos…',
]

interface Props {
  onDone: () => void
  /** ms — si no se pasa, usa 0-2000 (nav) */
  duration?: number
  /** true = modo quiz con mensajes detallados que van rotando */
  quizMode?: boolean
}

export function TravelLoader({ onDone, duration, quizMode = false }: Props) {
  const [emojiIdx, setEmojiIdx] = useState(() => Math.floor(Math.random() * EMOJIS.length))
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * (quizMode ? QUIZ_MESSAGES : NAV_MESSAGES).length))
  const [fading, setFading] = useState(false)
  const dur = useRef(duration ?? Math.random() * 2000)
  const messages = quizMode ? QUIZ_MESSAGES : NAV_MESSAGES

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

  useEffect(() => {
    if (!quizMode) return
    const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 1400)
    return () => clearInterval(t)
  }, [quizMode, messages.length])

  return (
    <div
      className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center"
      style={{ transition: 'opacity 0.45s ease', opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="text-6xl select-none animate-bounce">
        {EMOJIS[emojiIdx]}
      </div>
      <p className="text-gray-400 text-sm font-medium mt-5 text-center px-8 max-w-xs" style={{ transition: 'opacity 0.3s ease' }}>
        {messages[msgIdx]}
      </p>
    </div>
  )
}
