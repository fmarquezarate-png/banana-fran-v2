declare module 'react-simple-maps' {
  import type { ComponentType, ReactNode, SVGAttributes, CSSProperties } from 'react'

  export interface ComposableMapProps extends SVGAttributes<SVGElement> {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: CSSProperties
    className?: string
  }
  export const ComposableMap: ComponentType<ComposableMapProps>

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: GeoFeature[] }) => ReactNode
    parseGeographies?: (features: GeoFeature[]) => GeoFeature[]
  }
  export const Geographies: ComponentType<GeographiesProps>

  export interface GeoFeature {
    rsmKey: string
    id: string | number
    properties: Record<string, unknown>
    type: string
    geometry: object
  }

  export interface GeographyStyle {
    default?: CSSProperties
    hover?: CSSProperties
    pressed?: CSSProperties
  }

  export interface GeographyProps extends SVGAttributes<SVGPathElement> {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: GeographyStyle
    className?: string
  }
  export const Geography: ComponentType<GeographyProps>

  export interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    onMoveEnd?: (args: { coordinates: [number, number]; zoom: number }) => void
    maxZoom?: number
    minZoom?: number
    children?: ReactNode
    translateExtent?: [[number, number], [number, number]]
    filterZoomEvent?: (evt: Event) => boolean
  }
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Marker: ComponentType<Record<string, unknown>>
  export const Graticule: ComponentType<Record<string, unknown>>
  export const Sphere: ComponentType<Record<string, unknown>>
}

declare module 'world-atlas/countries-110m.json' {
  const data: object
  export default data
}

declare module 'world-atlas/countries-50m.json' {
  const data: object
  export default data
}
