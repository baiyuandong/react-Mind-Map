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

/**
 * 改进后的 MiniMap：
 *
 * 利用 getBoundingClientRect 做双向映射，但去掉了所有在 moveXY 入参处乘除 zoom
 * 的复杂逻辑。改为：miniMap 的交互直接算出"主画布应该移动多少 px"，
 * 再根据 store.x 与 left(px) 的关系反向算出 moveXY 需要的入参值。
 *
 * 核心关系：
 *   store.x (vw) → left(px) = store.x * vw / 100
 *   wrapper left 变化 Δleft(px) → store.x 变化 Δx = Δleft * 100 / vw
 *   而 moveXY(xParam) → store.x += xParam / zoom
 *   所以 xParam / zoom = Δleft * 100 / vw → xParam = Δleft * zoom * 100 / vw
 *
 * 点击/拖拽最终都算出 Δleft(px)（主画布视口需要移动的像素），代入上式即可。
 */
const PreviewMiniMap: React.FC<PreviewMiniMapProps> = ({ mindmap, x, y, zoom, moveXY, containerRef }) => {
    const previewRef = React.useRef<HTMLDivElement | null>(null)
    const viewportRef = React.useRef<HTMLDivElement | null>(null)
    const draggingRef = React.useRef(false)
    const lastPosRef = React.useRef({ x: 0, y: 0 })

    const previewWidth = 240
    const previewHeight = 160

    const [scale, setScale] = React.useState(0.3)

    // ---------- 工具函数：将 Δleft(px) 转为 moveXY 需要的入参 ----------
    const leftPxToMoveXYParam = React.useCallback(
        (deltaLeftPx: number, deltaTopPx: number) => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            return {
                xParam: (deltaLeftPx * zoom / vw) * 100,
                yParam: (deltaTopPx * zoom / vh) * 100,
            }
        },
        [zoom],
    )

    // ---------- 计算缩略图 scale（基于节点树实际边界） ----------
    const computeScale = React.useCallback(() => {
        const preview = previewRef.current
        const wrapper = document.getElementById('rmind_mindmap_wrapper') as HTMLElement | null
        if (!preview || !wrapper) return

        const rootEl = wrapper.querySelector<HTMLElement>(
            '#rmind_root_node, [data-tag="nodeLeft"], [data-tag="nodeRight"]',
        )
        if (!rootEl) return

        const wrapperRect = wrapper.getBoundingClientRect()
        const rootRect = rootEl.getBoundingClientRect()

        const contentLeft = (rootRect.left - wrapperRect.left) / zoom - 100
        const contentTop = (rootRect.top - wrapperRect.top) / zoom - 60
        const contentRight = (rootRect.right - wrapperRect.left) / zoom + 100
        const contentBottom = (rootRect.bottom - wrapperRect.top) / zoom + 60

        const contentW = Math.max(100, contentRight - contentLeft)
        const contentH = Math.max(60, contentBottom - contentTop)

        const previewInnerW = Math.max(24, preview.clientWidth - 12)
        const previewInnerH = Math.max(24, preview.clientHeight - 12)

        const s = Math.min(previewInnerW / contentW, previewInnerH / contentH, 0.8)
        setScale(Math.max(0.15, s))
    }, [zoom])

    // ---------- 更新视口框 ----------
    const updateViewportRect = React.useCallback(() => {
        const container = containerRef.current
        const wrapper = document.getElementById('rmind_mindmap_wrapper') as HTMLElement | null
        const preview = previewRef.current
        if (!container || !preview || !wrapper) return

        const containerRect = container.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()

        const offsetLeft = (containerRect.left - wrapperRect.left) / zoom
        const offsetTop = (containerRect.top - wrapperRect.top) / zoom

        const visibleW = containerRect.width / zoom
        const visibleH = containerRect.height / zoom

        const vp = viewportRef.current
        if (vp) {
            vp.style.left = offsetLeft * scale + 6 + 'px'
            vp.style.top = offsetTop * scale + 6 + 'px'
            vp.style.width = Math.max(12, visibleW * scale) + 'px'
            vp.style.height = Math.max(12, visibleH * scale) + 'px'
        }
    }, [containerRef, scale, zoom])

    React.useEffect(() => { computeScale() }, [computeScale, mindmap])
    React.useEffect(() => { updateViewportRect() }, [updateViewportRect, mindmap, scale])
    React.useEffect(() => {
        window.addEventListener('resize', computeScale)
        return () => window.removeEventListener('resize', computeScale)
    }, [computeScale])

    // ---------- 拖拽 ----------
    React.useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!draggingRef.current) return
            const dx = e.clientX - lastPosRef.current.x
            const dy = e.clientY - lastPosRef.current.y
            lastPosRef.current = { x: e.clientX, y: e.clientY }

            // 为使 mini map 拖拽灵敏度与主画布拖拽一致，
            // 直接传递屏幕像素位移（与 createMouseDragHandler 相同），
            // 让 moveXY 内部的 zoom 除法和 leftPxToMoveXYParam 一致处理。
            // 鼠标右移(dx>0) → 视口跟随右移，同主画布行为
            moveXY(dx * 100 / window.innerWidth, dy * 100 / window.innerHeight)
        }
        const handleUp = () => {
            draggingRef.current = false
            requestAnimationFrame(() => updateViewportRect())
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [moveXY, updateViewportRect])

    const handleMouseDown = (e: React.MouseEvent) => {
        draggingRef.current = true
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        e.stopPropagation()
    }

    // ---------- 点击跳转 ----------
    const handleClick = (e: React.MouseEvent) => {
        const preview = previewRef.current
        const container = containerRef.current
        const wrapper = document.getElementById('rmind_mindmap_wrapper') as HTMLElement | null
        if (!preview || !container || !wrapper) return

        const previewRect = preview.getBoundingClientRect()

        // 点击位置在 mini map 内容区的相对坐标 (去掉 padding 6px)
        const clickX = e.clientX - previewRect.left - 6
        const clickY = e.clientY - previewRect.top - 6

        // → 未缩放内容中的坐标
        const targetX = clickX / scale
        const targetY = clickY / scale

        // 当前 container 可视区域的中心在未缩放内容中的坐标
        const containerRect = container.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()

        const currentCenterX = (containerRect.left + containerRect.width / 2 - wrapperRect.left) / zoom
        const currentCenterY = (containerRect.top + containerRect.height / 2 - wrapperRect.top) / zoom

        // 未缩放内容中的偏移
        const deltaX = targetX - currentCenterX
        const deltaY = targetY - currentCenterY

        // 点击跳转：要使视口中心移到目标点 → wrapper 需要反向移动
        // 目标在右侧(deltaX>0) → wrapper 左移 → left 减小 → Δleft 为负
        const { xParam, yParam } = leftPxToMoveXYParam(-deltaX, -deltaY)
        moveXY(xParam, yParam)
    }

    return (
        <div
            style={{
                width: previewWidth,
                height: previewHeight,
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 8,
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                zIndex: 15,
            }}
        >
            <div
                ref={previewRef}
                onClick={handleClick}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    background: '#fff',
                    cursor: 'crosshair',
                }}
            >
                {/* 缩略内容 */}
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        left: 6,
                        top: 6,
                        pointerEvents: 'none',
                    }}
                >
                    <div style={{ padding: 6, color: '#222', fontSize: 14 }}>
                        <div
                            style={{
                                fontWeight: 700,
                                background: '#2d99d7',
                                color: '#fff',
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 15,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {mindmap.name}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            {mindmap.children.map((c) => (
                                <div
                                    key={c.id}
                                    style={{
                                        marginLeft: 16,
                                        marginTop: 6,
                                        background: '#f5f9ff',
                                        display: 'inline-block',
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        border: '1px solid #e6f2ff',
                                        fontSize: 13,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 视口指示框 */}
                <div
                    ref={viewportRef}
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        left: 6,
                        top: 6,
                        width: 40,
                        height: 30,
                        border: '2px solid rgba(45,153,215,0.95)',
                        background: 'rgba(45,153,215,0.08)',
                        cursor: 'move',
                        borderRadius: 2,
                    }}
                />
            </div>
        </div>
    )
}

export default PreviewMiniMap
