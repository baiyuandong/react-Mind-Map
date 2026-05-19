import React, { useEffect, useRef } from "react"
import getDragEvents from "../utils/getDragEvents"
import useMindMapStore from "../store"
import { ROOT_NODE_ID } from "../types"
import type { MindMapNode } from "../types"

interface DragCanvasProps {
  parentRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  mindmap: MindMapNode
}

const DragCanvas: React.FC<DragCanvasProps> = ({ parentRef, containerRef, mindmap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const getTheme = useMindMapStore((s) => s.getTheme)
  const moveNode = useMindMapStore((s) => s.moveNode)
  const zoom = useMindMapStore((s) => s.zoom)
  const x = useMindMapStore((s) => s.x)
  const y = useMindMapStore((s) => s.y)
  const flag = useMindMapStore((s) => s.curSelect)

  const mindmapHook = { moveNode }
  const theme = getTheme()

  useEffect(() => {
    const handleResize = () => {
      const dom = canvasRef.current
      const parent = parentRef.current
      if (dom && parent) {
        dom.width = parent.offsetWidth
        dom.height = parent.offsetHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const dom = canvasRef.current
    const parent = parentRef.current
    const container = containerRef.current
    if (!dom || !parent || !container) return

    dom.width = parent.offsetWidth
    dom.height = parent.offsetHeight

    const sel = "[data-mindmap-wrapper]"
    const wrapper = document.getElementById(ROOT_NODE_ID)?.closest(sel) || document.querySelector(sel)

    const handleDrag = getDragEvents(mindmap, dom, container, theme, mindmapHook, zoom, { x, y })

    handleDrag.forEach((event) => {
      document.addEventListener(event.type, event.listener as EventListener)
    })

    return () => {
      handleDrag.forEach((event) => {
        document.removeEventListener(event.type, event.listener as EventListener)
      })
    }
  }, [mindmap, theme, zoom, x, y, flag])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  )
}

export default DragCanvas
