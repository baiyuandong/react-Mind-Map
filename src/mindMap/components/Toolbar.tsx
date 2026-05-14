import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import useMindMapStore from '../store'
import type { MindMapNode } from '../types'

interface ToolbarProps {
  layer: number
  node: MindMapNode
  parent: MindMapNode | { id: string; children: MindMapNode[] }
  x: number
  y: number
  onClose: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ layer, node, parent, x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const addChild = useMindMapStore((s) => s.addChild)
  const addSibling = useMindMapStore((s) => s.addSibling)
  const deleteNode = useMindMapStore((s) => s.deleteNode)
  const editNode = useMindMapStore((s) => s.editNode)
  const toggleChildren = useMindMapStore((s) => s.toggleChildren)
  const selectNode = useMindMapStore((s) => s.selectNode)
  const toggleEditPanel = useMindMapStore((s) => s.toggleEditPanel)

  const handleAddChild = () => {
    addChild(node.id)
    onClose()
  }

  const handleAddSibling = () => {
    addSibling(node.id, parent.id)
    onClose()
  }

  const handleDeleteNode = () => {
    deleteNode(node.id, parent.id)
    onClose()
  }

  const handleEditNode = () => {
    editNode(node.id)
    onClose()
  }

  const handleToggleChildren = () => {
    toggleChildren(node.id, !node.showChildren)
    onClose()
  }

  const handleAddInfo = () => {
    selectNode(node.id)
    toggleEditPanel(true)
    onClose()
  }

  // 点击菜单外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 9999,
    minWidth: 190,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: '6px 6px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
    fontSize: 13,
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#333',
    textAlign: 'left',
    fontSize: 14,
    justifyContent: 'space-between',
  }

  const dividerStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: '#f0f0f0',
    margin: '6px 0',
  }

  return ReactDOM.createPortal(
    <div ref={menuRef} style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button style={itemStyle} onClick={handleAddChild} title="添加子节点">
          <span>新增子级分类</span>
          <span style={{ flex: '0 0 auto', marginLeft: 8, fontSize: 12, color: '#8a8a8a' }}>tab</span>
        </button>
        <button style={itemStyle} onClick={handleAddSibling} title="添加兄弟节点" disabled={layer < 1}>
          <span>新增同级分类</span>
        </button>
        <button
          style={itemStyle}
          onClick={handleToggleChildren}
          title="显隐子节点"
          disabled={layer < 1 || node.children.length === 0}
        >
          <span>{node.showChildren ? '收起子级' : '展开/折叠子级'}</span>
        </button>

        <div style={dividerStyle} />

        <button style={itemStyle} onClick={handleEditNode} title="重命名">
          <span>重命名</span>
          <span style={{ flex: '0 0 auto', marginLeft: 8, fontSize: 12, color: '#8a8a8a' }}>双击</span>
        </button>
        <button style={itemStyle} onClick={handleAddInfo}>
          <span>备注</span>
        </button>

        <div style={dividerStyle} />

        <button style={itemStyle} onClick={handleDeleteNode} title="删除" disabled={layer < 1}>
          <span>删除</span>
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default Toolbar
