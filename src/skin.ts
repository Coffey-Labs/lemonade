import { createContext, useContext } from 'react'

/**
 * Two skins over one game. "crt" is the 1979 machine, kept honest; "modern"
 * is the same logic with cel-shaded art and a funk band. The rules never
 * differ between them.
 */
export type Skin = 'crt' | 'modern'

export const SKIN_KEY = 'lemonade.skin.v1'

export function readSkin(): Skin {
  try {
    return window.localStorage.getItem(SKIN_KEY) === 'crt' ? 'crt' : 'modern'
  } catch {
    return 'modern'
  }
}

export function writeSkin(s: Skin): void {
  try {
    window.localStorage.setItem(SKIN_KEY, s)
  } catch {
    // A skin that does not stick is a small loss; carry on.
  }
}

export interface SkinApi {
  skin: Skin
  setSkin: (s: Skin) => void
  toggle: () => void
}

export const SkinContext = createContext<SkinApi>({
  skin: 'modern',
  setSkin: () => {},
  toggle: () => {},
})

export const useSkin = () => useContext(SkinContext)
