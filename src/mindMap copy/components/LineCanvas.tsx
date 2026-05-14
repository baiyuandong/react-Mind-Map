import type { MindMapNode } from '../types'
import * as React from 'react'
import useMindMapStore from '../store'
import { drawLineCanvas } from '../utils/drawCanvas'

type LineCanvasProps = {
  parentRef: React.RefObject<HTMLDivElement | null>
  mindmap: MindMapNode
  nodeRefs: Set<React.RefObject<HTMLDivElement | null>>
}

const LineCanvas: React.FC<LineCanvasProps> = ({ parentRef, mindmap, nodeRefs }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const getTheme = useMindMapStore(s => s.getTheme)
  const curSelect = useMindMapStore(s => s.curSelect)
  const curEdit = useMindMapStore(s => s.curEdit)

  const redraw = React.useCallback(() => {
    const dom = canvasRef.current
    const parent = parentRef.current
    if (!dom || !parent)
      return

    // 设置 canvas 位图尺寸和 CSS 渲染尺寸一致
    const w = parent.offsetWidth
    const h = parent.offsetHeight
    dom.width = w
    dom.height = h
    dom.style.width = `${w}px`
    dom.style.height = `${h}px`

    const ctx = dom.getContext('2d')
    if (!ctx)
      return

    // 直接从 DOM 查找所有节点
    const nodeElements = parent.querySelectorAll<HTMLElement>('[data-tag]')
    const map = new Map<string, [number, number, number, string]>()

    nodeElements.forEach((el) => {
      const id = el.id
      if (id) {
        map.set(id, [
          el.offsetLeft,
          el.offsetLeft + el.offsetWidth,
          el.offsetTop + 0.5 * el.offsetHeight,
          el.dataset.tag || '',
        ])
      }
    })

    if (map.size > 0) {
      const theme = getTheme()
      drawLineCanvas(ctx, theme, mindmap, map)
    }
  }, [getTheme, mindmap, parentRef])

  React.useEffect(() => {
    const handleResize = () => redraw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [redraw])

  React.useEffect(() => {
    redraw()
  }, [redraw, mindmap, curSelect, curEdit])

  React.useEffect(() => {
    const t1 = setTimeout(() => redraw(), 50)
    const t2 = setTimeout(() => redraw(), 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -2,
        pointerEvents: 'none',
      }}
    />
  )
}

export default LineCanvas
