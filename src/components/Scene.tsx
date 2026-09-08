import { useSkin } from '../skin'
import type { DayConditions } from '../game/types'
import { CelScene } from './CelScene'
import { PixelScene } from './PixelScene'

/**
 * The same day, drawn twice: chunky Atari rectangles for the 1979 skin,
 * cel-shaded vector art for the modern one.
 */
export function Scene({
  conditions,
  price,
  traffic,
  variant = 'full',
}: {
  conditions: DayConditions
  price?: number
  /** How busy the street is, 0 to 1. Only the cel scene shows a crowd. */
  traffic?: number
  /** "strip" crops to the counter and the street, for screens short on room. */
  variant?: 'full' | 'strip'
}) {
  const { skin } = useSkin()
  if (skin !== 'modern') {
    // The 1979 financial report was a page of text, and stays one.
    return variant === 'strip' ? null : <PixelScene conditions={conditions} price={price} />
  }
  return <CelScene conditions={conditions} price={price} traffic={traffic} variant={variant} />
}
