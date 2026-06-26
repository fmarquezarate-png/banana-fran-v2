import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { Destination, DestinationCategory } from '@/data/destinations'

const COLORS: Record<DestinationCategory, string> = {
  perfect: '#1e6fb5',
  good:    '#c9a96e',
  ok:      '#9ca3af',
  warning: '#ff0040',
}

interface Props {
  destinations: Destination[]
  neutralColors?: boolean
}

export function AllDestinationsMap({ destinations, neutralColors = false }: Props) {
  const navigate = useNavigate()

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[300px] sm:h-[420px]">
      <MapContainer
        center={[20, 15]}
        zoom={2}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {destinations.map((dest) => {
          const [lat, lng] = dest.coords
          const color = neutralColors ? '#1e6fb5' : COLORS[dest.category]
          return (
            <CircleMarker
              key={dest.id}
              center={[lat, lng]}
              radius={7}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <p className="font-bold text-sm">{dest.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{dest.country}</p>
                  <button
                    onClick={() => navigate(`/destino/${dest.id}`)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
                  >
                    Ver destino →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
