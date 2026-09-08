import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function Crt({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="cabinet">
      <div className="bezel">
        <div className="screen">
          <div className="screen-inner">{children}</div>
          <div className="scanlines" aria-hidden />
          <div className="vignette" aria-hidden />
        </div>
      </div>
      {footer}
    </div>
  )
}

/**
 * A television shows one fixed picture; it never scrolls. If a page is taller
 * than the tube, shrink the picture until it fits rather than clipping it.
 */
export function Fit({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const measure = () => {
      const el = box.current
      const page = el?.firstElementChild as HTMLElement | null
      if (!el || !page) return
      // offsetHeight is the laid-out size and ignores the transform, so
      // measuring here cannot feed back into itself.
      const h = page.offsetHeight
      const avail = el.clientHeight
      setScale(h > 0 && avail > 0 ? Math.min(1, avail / h) : 1)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (box.current) ro.observe(box.current)
    if (box.current?.firstElementChild) ro.observe(box.current.firstElementChild)
    return () => ro.disconnect()
  })

  return (
    <div className="screen-body" ref={box} style={{ '--fit': scale } as React.CSSProperties}>
      {children}
    </div>
  )
}

export function Line({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`line ${className}`}>{children ?? ' '}</div>
}

/** Atari inverse video: light background, dark characters. */
export function Inv({ children }: { children: ReactNode }) {
  return <span className="inv">{children}</span>
}

export function Btn({
  children,
  onClick,
  kind = 'normal',
  disabled,
  title,
}: {
  children: ReactNode
  onClick: () => void
  kind?: 'normal' | 'primary' | 'ghost'
  disabled?: boolean
  title?: string
}) {
  return (
    <button className={`btn btn-${kind}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}
