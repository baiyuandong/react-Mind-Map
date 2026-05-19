import React, { useEffect, useRef, useState, useCallback } from 'react'
import useMindMapStore from '../store'
import { ROOT_PARENT, LEFT_NODE, RIGHT_NODE, DROP_AREA } from '../types'
import type { MindMapNode } from '../types'
import InputDiv from './InputDiv'
import Toolbar from './Toolbar'
import MdPreview from './MdPreview'

interface NodeProps {
  layer: number
  node: MindMapNode
  nodeRefs: Set<React.RefObject<HTMLDivElement | null>>
  parent: MindMapNode | { id: string; children: MindMapNode[] }
  onLeft?: boolean
}

const LAYER_STYLES = [
  // layer 0 - 根节点
  {
    padding: '15px 20px',
    color: '#ffffff',
    fontSize: '120%',
    fontWeight: 700,
    backgroundColor: 'var(--theme-dark, #e79021)',
    border: '2px solid var(--theme-ex, #ce7529)',
  },
  // layer 1
  {
    backgroundColor: 'var(--theme-light, #f4cc87)',
  },
  // layer 2
  {
    padding: '10px 15px',
  },
  // layer >= 3
  {
    padding: '0 15px',
    border: 'none',
    fontSize: '90%',
  },
]

const Node: React.FC<NodeProps> = ({ layer, node, nodeRefs, parent, onLeft = false }) => {
  const selfRef = useRef<HTMLDivElement>(null)
  const isRightClick = useRef(false)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)

  const curSelect = useMindMapStore((s) => s.curSelect)
  const curEdit = useMindMapStore((s) => s.curEdit)
  const editPanelShow = useMindMapStore((s) => s.editPanelShow)
  const selectNode = useMindMapStore((s) => s.selectNode)
  const editNode = useMindMapStore((s) => s.editNode)
  const toggleChildren = useMindMapStore((s) => s.toggleChildren)
  const clearNodeStatus = useMindMapStore((s) => s.clearNodeStatus)
  const toggleKnowledgePointModal = useMindMapStore(s => s.toggleKnowledgePointModal)
  const toggleKnowledgeDrawer = useMindMapStore(s => s.toggleKnowledgeDrawer)


  const handleSelectNode = () => {
    selectNode(node.id, true)
  }

  const handleEditNode = () => {
    editNode(node.id)
  }

  const handleToggleChildren = () => {
    toggleChildren(node.id, !node.showChildren)
    clearNodeStatus()
  }





    const handleOpenKnowledgePoint = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectNode(node.id, true)
    toggleKnowledgeDrawer(true, node.id)
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isRightClick.current = true
      selectNode(node.id, true)
      const rect = e.currentTarget.getBoundingClientRect()
      setContextMenuPos({ x: rect.right, y: rect.top })
    },
    [node.id, selectNode],
  )

  const handleCloseMenu = useCallback(() => {
    setContextMenuPos(null)
  }, [])

  useEffect(() => {
    if (selfRef.current) {
      nodeRefs.add(selfRef)
    }
    return () => {
      if (selfRef.current) {
        nodeRefs.delete(selfRef)
      }
    }
  }, [nodeRefs])

  useEffect(() => {
    if (curSelect === node.id && selfRef.current) {
      if (!isRightClick.current) {
        selfRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      }
      isRightClick.current = false
    }
  }, [curSelect, node.id])

  const layerStyleIndex = Math.min(layer, 3)
  const baseStyle = LAYER_STYLES[layerStyleIndex] || {}

  return (
    <div
      ref={selfRef}
      id={node.id}
      data-tag={onLeft ? LEFT_NODE : RIGHT_NODE}
      data-parent={parent.id}
      data-show-children={node.showChildren}
      draggable={layer > 0 && curEdit !== node.id}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={handleContextMenu}
      style={{
        position: 'relative',
        minWidth: 10,
        maxWidth: 200,
        margin: '20px 40px',
        padding: 15,
        backgroundColor: '#ffffff',
        border: '1px solid var(--theme-main, #eda938)',
        borderRadius: 15,
        cursor: 'pointer',
        boxShadow: curSelect === node.id ? '0 0 0 3px #ffffff, 0 0 0 6px var(--theme-ex, #ce7529)' : undefined,
        zIndex: curSelect === node.id ? 1 : undefined,
        ...baseStyle,
      }}
    >
      {curEdit === node.id && <InputDiv nodeId={node.id}>{node.name}</InputDiv>}

      {/* Drop Area */}
      <div
        data-tag={DROP_AREA}
        onClick={handleSelectNode}
        onDoubleClick={handleEditNode}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />

      {/* 知识点数量徽章 */}
      {node.knowledgePoints && node.knowledgePoints.length > 0 && (
        <div
          onClick={handleOpenKnowledgePoint}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: 20,
            height: 20,
            backgroundColor: '#2d99d7',
            color: '#fff',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          {node.knowledgePoints.length}
        </div>
      )}

      <p style={{ margin: 0, lineHeight: '1.5em', wordBreak: 'break-word', minHeight: 18 }}>
        {node.name}
        {node.describe && <MdPreview mdtext={node.describe} />}
      </p>

      {layer > 0 && node.children.length > 0 && (
        <button
          onClick={handleToggleChildren}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #cccccc',
            borderRadius: '50%',
            outline: 'none',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            ...(onLeft ? { left: -12 } : { right: -12 }),
          }}
          aria-label={node.showChildren ? '收起' : '展开'}
          title={node.showChildren ? '收起子节点' : '展开子节点'}
        >
          <span style={{ display: 'block' }}>{node.showChildren ? '−' : '+'}</span>
        </button>
      )}

      {/* 右键菜单 */}
      {contextMenuPos && (
        <Toolbar
          layer={layer}
          node={node}
          parent={parent}
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={handleCloseMenu}
        />
      )}
    </div>
  )
}

export default Node
