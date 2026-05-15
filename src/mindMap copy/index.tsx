'use client'
import React from 'react'
import useMindMapStore from './store';
import type { NodeInfo, MindMapNode } from './types'
import { createWheelZoomHandler, createMouseDragHandler } from './utils/getMouseWheelEvent'
import getKeydownEvent from './utils/getKeydownEvent'
import { debounce } from './utils/assistFunctions'
import RootNode from './components/RootNode'
import DragCanvas from './components/DragCanvas'
import LineCanvas from './components/LineCanvas'
import EditPanel from './components/EditPanel'
import SearchBox from './components/SearchBox'
import KnowledgePointModal from './components/KnowledgePointModal'
import { useAppContext } from '@/context/app-context'
import { useSearchParams } from '@/next/navigation'
import { useKnowledgeTree } from '@/service/knowledgeSystem/use-knowledge'
import defaultMindmap from './utils/defaultMindmap'
import PreviewMiniMap from './components/PreviewMiniMap'



interface MindMapViewerProps {
    data?: Record<string, unknown>
    onSave?: (data: Record<string, unknown>) => void
    readonly?: boolean
    className?: string
    height?: string | number
    initialData?: string
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({
    readonly = false,
    className,
    height = 'calc(100vh - 56px)',
    initialData,
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const nodeRefs = React.useRef(new Set<React.RefObject<HTMLDivElement | null>>())
    const [flag, setFlag] = React.useState(0)

    // 新增：从 app context 和 url 获取 tenantId/systemId 并请求知识树
    const { currentWorkspace } = useAppContext()
    const searchParams = useSearchParams()
    const systemId = searchParams ? searchParams.get('systemId') || '' : ''
    const tenantId = currentWorkspace?.id || ''

    // 所有 selector 只返回原始值或 stable 引用
    const mindmap = useMindMapStore((s) => s.mindmap)
    const curSelect = useMindMapStore((s) => s.curSelect)
    const curEdit = useMindMapStore((s) => s.curEdit)
    const curNodeInfo = useMindMapStore((s) => s.curNodeInfo)
    const zoom = useMindMapStore((s) => s.zoom)
    const x = useMindMapStore((s) => s.x)
    const y = useMindMapStore((s) => s.y)

    const zoomIn = useMindMapStore((s) => s.zoomIn)
    const zoomOut = useMindMapStore((s) => s.zoomOut)
    const zoomReset = useMindMapStore((s) => s.zoomReset)
    const moveXY = useMindMapStore((s) => s.moveXY)
    const moveReset = useMindMapStore((s) => s.moveReset)
    const clearNodeStatus = useMindMapStore((s) => s.clearNodeStatus)
    const toggleChildren = useMindMapStore((s) => s.toggleChildren)
    const selectNode = useMindMapStore((s) => s.selectNode)
    const editNode = useMindMapStore((s) => s.editNode)
    const addChild = useMindMapStore((s) => s.addChild)
    const addSibling = useMindMapStore((s) => s.addSibling)
    const deleteNode = useMindMapStore((s) => s.deleteNode)
    const toggleEditPanel = useMindMapStore((s) => s.toggleEditPanel)
    const loadMindmap = useMindMapStore((s) => s.loadMindmap)
    const getMindmap = useMindMapStore((s) => s.getMindmap)
    const undoHistory = useMindMapStore((s) => s.undoHistory)
    const redoHistory = useMindMapStore((s) => s.redoHistory)
    const expandAll = useMindMapStore((s) => s.expandAll)
    const historyLength = useMindMapStore((s) => s.history.length)
    const redoStackLength = useMindMapStore((s) => s.redoStack.length)
    const mindmapJson = useMindMapStore((s) => JSON.stringify(s.mindmap))

    React.useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData)
                loadMindmap(parsed)
            } catch {
                // ignore
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 新增：根据 useKnowledgeTree 的返回数据加载思维导图，若为空则使用默认数据
    const treeQuery = useKnowledgeTree({ tenantId, systemId, enabled: !!tenantId && !!systemId })

    React.useEffect(() => {
        // 仅在 tenantId/systemId 可用时处理
        if (!tenantId || !systemId) return

        const resp = treeQuery.data
        const nodes = resp?.data

        if (Array.isArray(nodes) && nodes.length > 0) {
            const buildNodes = (arr: any[]): any[] =>
                arr.map((n) => ({
                    id: n.id,
                    text: n.name,
                    showChildren: true,
                    children: Array.isArray(n.children) && n.children.length ? buildNodes(n.children) : [],
                    parent_id: n.parent_id ?? '',
                    knowledgePoints: [],
                    info: n.describe,
                }))

            const root = { ...defaultMindmap, children: buildNodes(nodes) }
            loadMindmap(root)
        } else if (treeQuery.isFetched) {
            // 接口返回为空或无数据时使用默认脑图
            loadMindmap(defaultMindmap)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [treeQuery.data, treeQuery.isFetched, tenantId, systemId])

    React.useEffect(() => {
        localStorage.setItem('mindmap', mindmapJson)
    }, [mindmapJson])

    React.useEffect(() => {
        if (readonly) return

        const mindmapHook = { addChild, addSibling, editNode, deleteNode, toggleChildren, selectNode }
        const historyHook = { undoHistory, redoHistory }
        const handleKeydown = getKeydownEvent(
            {
                cur_select: curSelect,
                select_by_click: false,
                cur_edit: curEdit,
                cur_node_info: curNodeInfo,
            },
            mindmapHook,
            historyHook,
        )

        window.addEventListener('keydown', handleKeydown)
        return () => window.removeEventListener('keydown', handleKeydown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readonly, curSelect, curEdit, curNodeInfo])

    React.useEffect(() => {
        window.addEventListener('click', clearNodeStatus)
        return () => window.removeEventListener('click', clearNodeStatus)
    }, [clearNodeStatus])

    const handleResize = React.useCallback(() => {
        setFlag(Date.now())
    }, [])

    React.useEffect(() => {
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [handleResize])

    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const zoomHook = { zoomIn, zoomOut }
        const moveHook = { moveXY }

        const wheelZoomHandler = createWheelZoomHandler(zoomHook)
        container.addEventListener('wheel', wheelZoomHandler, { passive: false })

        const dragHandler = createMouseDragHandler(moveHook)
        container.addEventListener('mousedown', dragHandler.handleMouseDown)
        container.addEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4))
        container.addEventListener('mouseup', dragHandler.handleMouseUp)
        container.addEventListener('mouseleave', dragHandler.handleMouseUp)

        return () => {
            container.removeEventListener('wheel', wheelZoomHandler)
            container.removeEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4))
            container.removeEventListener('mouseup', dragHandler.handleMouseUp)
            container.removeEventListener('mouseleave', dragHandler.handleMouseUp)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flag, zoomIn, zoomOut, moveXY])

    const handleZoomIn = () => zoomIn()
    const handleZoomOut = () => zoomOut()
    const handleZoomReset = () => zoomReset()
    const handleMoveReset = () => moveReset()
    const handleUndo = () => undoHistory()
    const handleRedo = () => redoHistory()
    const handleExpand = () => expandAll('rmind_root_node')
    const handleSave = () => {
        const data = getMindmap()
        console.log('save mindmap data:', data)
    }

    const getTheme = useMindMapStore((s) => s.getTheme)
    const theme = getTheme()

    const themeCss = [
        '--theme-main: ' + theme.main + ';',
        '--theme-light: ' + theme.light + ';',
        '--theme-dark: ' + theme.dark + ';',
        '--theme-ex: ' + theme.ex + ';',
        '--theme-assist: ' + theme.assist + ';',
    ].join(' ')

    return (
        <div
            className={className}
            style={{
                position: 'relative',
                height,
                overflow: 'hidden',
                margin: 0,
                padding: 0,
                backgroundColor: '#f7f7f7',
            }}
        >
            <style>{':root {' + themeCss + '}'}</style>

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #eee',
                    zIndex: 10,
                    fontSize: 13,
                }}
            >

                <div />
                <div className='flex items-center gap-2'>
                    <SearchBox />
                    <ToolButton onClick={handleSave} title="保存">保存</ToolButton>
                </div>
            </div>


            <div
                ref={containerRef}
                id="rmind_main"
                style={{
                    height: 'calc(100% - 40px)',
                    marginTop: 40,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    ref={wrapperRef}
                    data-mindmap-wrapper
                    id="rmind_mindmap_wrapper"
                    draggable={false}
                    style={{
                        position: 'relative',
                        width: 'fit-content',
                        padding: '30vh 30vw',
                        cursor: 'grab',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        left: x + 'vw',
                        top: y + 'vh',
                    }}
                >
                    <RootNode
                        key={mindmap.id}
                        node={mindmap}
                        nodeRefs={nodeRefs.current}
                    />
                    <DragCanvas
                        parentRef={wrapperRef}
                        containerRef={containerRef}
                        mindmap={mindmap}
                    />
                    <LineCanvas
                        parentRef={wrapperRef}
                        mindmap={mindmap}
                        nodeRefs={nodeRefs.current}
                    />
                </div>

                {/* 浮动缩放控件，位于画布右下角 */}
                <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    {/* 缩略图预览（新增） - 放在左侧，避免覆盖缩放控件 */}
                    {/* <PreviewMiniMap mindmap={mindmap} x={x} y={y} zoom={zoom} moveXY={moveXY} containerRef={containerRef} /> */}

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                        <ToolButton onClick={handleZoomOut} title="缩小">-</ToolButton>
                        <span style={{ fontSize: 12, color: '#888', minWidth: 60, textAlign: 'center' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <ToolButton onClick={handleZoomIn} title="放大">+</ToolButton>
                    </div>
                </div>

                <EditPanel />
                <KnowledgePointModal />
            </div>
        </div>
    )
}

interface ToolButtonProps {
    onClick: () => void
    title: string
    disabled?: boolean
    children: React.ReactNode
}

const ToolButton: React.FC<ToolButtonProps> = ({ onClick, title, disabled, children }) => {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            title={title}
            disabled={disabled}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.35 : 1,
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 16,
                lineHeight: 1,
            }}
        >
            {children}
        </button>
    )
}

export default MindMapViewer





