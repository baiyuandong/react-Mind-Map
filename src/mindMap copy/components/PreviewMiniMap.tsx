'use client'
import React from 'react'
import type { MindMapNode } from '../types'

interface PreviewMiniMapProps {
    mindmap: MindMapNode
    x: number
    y: number
    zoom: number
    moveXY: (x: number, y: number) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}

const PreviewMiniMap: React.FC<PreviewMiniMapProps> = ({ mindmap, x, y, zoom, moveXY, containerRef }) => {
    const previewRef = React.useRef<HTMLDivElement | null>(null)
    const viewportRef = React.useRef<HTMLDivElement | null>(null)
    const draggingRef = React.useRef(false)
    const lastPosRef = React.useRef({ x: 0, y: 0 })

    const previewWidth = 280
    const previewHeight = 180
    // 最小/默认缩放，作为回退
    const defaultScale = 0.16

    const [scale, setScale] = React.useState(defaultScale)

    const computeScale = React.useCallback(() => {
        const preview = previewRef.current
        const wrapper = document.getElementById('rmind_mindmap_wrapper') as HTMLElement | null
        if (!preview || !wrapper) {
            setScale(defaultScale)
            return
        }

        const previewInnerW = Math.max(24, preview.clientWidth - 12)
        const previewInnerH = Math.max(24, preview.clientHeight - 12)

        const wrapperRect = wrapper.getBoundingClientRect()
        const unscaledW = Math.max(1, wrapperRect.width / Math.max(zoom, 0.001))
        const unscaledH = Math.max(1, wrapperRect.height / Math.max(zoom, 0.001))

        const scaleW = previewInnerW / unscaledW
        const scaleH = previewInnerH / unscaledH

        // 取较小的缩放比并限定范围，避免过大/过小
        const s = Math.min(scaleW, scaleH, 0.5)
        setScale(Math.max(0.16, s))
    }, [zoom])

    const updateViewportRect = React.useCallback(() => {
        const container = containerRef.current
        const preview = previewRef.current
        if (!container || !preview) return

        const vw = window.innerWidth
        const vh = window.innerHeight

        const leftPx = Number(x) * vw / 100
        const topPx = Number(y) * vh / 100

        const viewOriginX = -leftPx / zoom
        const viewOriginY = -topPx / zoom

        const visibleW = container.clientWidth / zoom
        const visibleH = container.clientHeight / zoom

        const rectLeft = viewOriginX * scale + 6
        const rectTop = viewOriginY * scale + 6
        const rectW = visibleW * scale
        const rectH = visibleH * scale

        if (viewportRef.current) {
            viewportRef.current.style.left = rectLeft + 'px'
            viewportRef.current.style.top = rectTop + 'px'
            viewportRef.current.style.width = Math.max(12, rectW) + 'px'
            viewportRef.current.style.height = Math.max(12, rectH) + 'px'
        }
    }, [x, y, zoom, containerRef, scale])

    React.useEffect(() => {
        computeScale()
    }, [computeScale, mindmap])

    React.useEffect(() => {
        updateViewportRect()
    }, [updateViewportRect, mindmap, scale])

    React.useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!draggingRef.current) return
            const dx = e.clientX - lastPosRef.current.x
            const dy = e.clientY - lastPosRef.current.y
            lastPosRef.current = { x: e.clientX, y: e.clientY }

            const vw = window.innerWidth
            const vh = window.innerHeight

            // 使用动态计算的 scale 替换原先的常量映射，减少随内容变化的偏差
            const xParam = - (dx / scale) * (zoom * zoom) * 100 / vw
            const yParam = - (dy / scale) * (zoom * zoom) * 100 / vh

            moveXY(xParam, yParam)
        }
        const handleUp = () => {
            draggingRef.current = false
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [zoom, moveXY, scale])

    const handleMouseDown = (e: React.MouseEvent) => {
        draggingRef.current = true
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        e.stopPropagation()
    }

    const handleClick = (e: React.MouseEvent) => {
        const box = previewRef.current
        const container = containerRef.current
        if (!box || !container) return
        const rect = box.getBoundingClientRect()
        const clickX = e.clientX - rect.left - 6
        const clickY = e.clientY - rect.top - 6

        const targetUnscaledX = clickX / scale
        const targetUnscaledY = clickY / scale

        const desiredOriginX = targetUnscaledX - (container.clientWidth / (2 * zoom))
        const desiredOriginY = targetUnscaledY - (container.clientHeight / (2 * zoom))

        const vw = window.innerWidth
        const vh = window.innerHeight

        const currentLeftPx = Number(x) * vw / 100
        const currentTopPx = Number(y) * vh / 100

        const currentOriginX = -currentLeftPx / zoom
        const currentOriginY = -currentTopPx / zoom

        const deltaOriginX = desiredOriginX - currentOriginX
        const deltaOriginY = desiredOriginY - currentOriginY

        const xParam = - deltaOriginX * (zoom * zoom) * 100 / vw
        const yParam = - deltaOriginY * (zoom * zoom) * 100 / vh

        moveXY(xParam, yParam)
    }

    React.useEffect(() => {
        window.addEventListener('resize', computeScale)
        return () => window.removeEventListener('resize', computeScale)
    }, [computeScale])

    // 不再使用绝对定位，让父容器通过 flex 布局安排位置，避免覆盖缩放控件
    return (
        <div style={{ width: previewWidth, height: previewHeight, background: 'rgba(255,255,255,0.98)', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 15 }}>
            <div ref={previewRef} onClick={handleClick} style={{ position: 'relative', width: '100%', height: '100%', background: '#fff', cursor: 'crosshair' }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', left: 6, top: 6 }}>
                    <div style={{ padding: 6, color: '#222', fontSize: 16 }}>
                        <div style={{ fontWeight: 700, background: '#2d99d7', color: '#fff', display: 'inline-block', padding: '6px 10px', borderRadius: 8 }}>{mindmap.text}</div>
                        <div style={{ marginTop: 8 }}>
                            {mindmap.children.map((c) => (
                                <div key={c.id} style={{ marginLeft: 14, marginTop: 6, background: '#f5f9ff', display: 'inline-block', padding: '4px 8px', borderRadius: 6, border: '1px solid #e6f2ff' }}>{c.text}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    ref={viewportRef}
                    onMouseDown={handleMouseDown}
                    style={{ position: 'absolute', left: 6, top: 6, width: 40, height: 30, border: '2px solid rgba(45,153,215,0.95)', background: 'rgba(45,153,215,0.08)', cursor: 'move' }}
                />
            </div>
        </div>
    )
}

export default PreviewMiniMap
