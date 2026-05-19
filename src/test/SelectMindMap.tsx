'use client'
import { Dialog, DialogCloseButton, DialogContent } from '@langgenius/dify-ui/dialog'
import * as React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

export type SelectMindMapProps = {
  isShow: boolean
  onHide: () => void
  onNodeSelect?: (nodeId: string, nodeName: string) => void
}

type MindMapNode = {
  id: string
  name: string
  children: MindMapNode[]
}

const THEME = {
  main: '#2d99d7',
  light: '#e2f5ff',
  dark: '#2786c3',
  line: '#b8d4e8',
  highlight: '#f59e0b',
  highlightBg: '#fef3c7',
  selected: '#10b981',
  selectedLight: '#d1fae5',
}

// 知识体系数据
const knowledgeData: MindMapNode = {
  id: 'root',
  name: '智能制造知识体系',
  children: [
    {
      id: 'node1',
      name: '工艺规划',
      children: [
        { id: 'node1-1', name: '加工工艺', children: [] },
        { id: 'node1-2', name: '装配工艺', children: [] },
        { id: 'node1-3', name: '热处理工艺', children: [] },
        { id: 'node1-4', name: '表面处理', children: [] },
      ],
    },
    {
      id: 'node2',
      name: '设备管理',
      children: [
        { id: 'node2-1', name: '设备监控', children: [] },
        { id: 'node2-2', name: '维护保养', children: [] },
        { id: 'node2-3', name: '设备选型', children: [] },
        { id: 'node2-4', name: '故障诊断', children: [] },
      ],
    },
    {
      id: 'node3',
      name: '质量管理',
      children: [
        { id: 'node3-1', name: '质量检测', children: [] },
        { id: 'node3-2', name: '质量分析', children: [] },
        { id: 'node3-3', name: '质量改进', children: [] },
      ],
    },
    {
      id: 'node4',
      name: '生产调度',
      children: [
        { id: 'node4-1', name: '排产计划', children: [] },
        { id: 'node4-2', name: '资源分配', children: [] },
        { id: 'node4-3', name: '进度跟踪', children: [] },
      ],
    },
    {
      id: 'node5',
      name: '物料管理',
      children: [
        { id: 'node5-1', name: '库存管理', children: [] },
        { id: 'node5-2', name: '采购管理', children: [] },
      ],
    },
  ],
}

// 树形节点组件
const TreeNode: React.FC<{
  node: MindMapNode
  level: number
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}> = ({ node, level, selectedIds, expandedIds, onToggle, onSelect }) => {
  const isRoot = level === 0
  const isSelected = selectedIds.has(node.id)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children.length > 0
  const indent = level * 24

  return (
    <div>
      <div
        className="group flex items-center gap-2 cursor-pointer select-none"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => !isRoot && onSelect(node.id)}
      >
        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {/* 复选框 */}
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-[#10b981] border-[#10b981]'
              : 'border-gray-300 group-hover:border-[#10b981]'
          }`}
        >
          {isSelected && (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        {/* 节点名称 */}
        <span
          className={`text-sm ${isRoot ? 'font-semibold text-white' : 'text-gray-700'} ${
            isSelected && !isRoot ? 'text-[#10b981] font-medium' : ''
          }`}
          style={isRoot ? { color: '#fff' } : undefined}
        >
          {node.name}
        </span>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const SelectMindMap: React.FC<SelectMindMapProps> = ({ isShow, onHide, onNodeSelect }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']))

  // 展开/收起
  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id))
        newSet.delete(id)
      else
        newSet.add(id)
      return newSet
    })
  }, [])

  // 展开全部
  const expandAll = useCallback(() => {
    const allIds = new Set<string>()
    const collect = (node: MindMapNode) => {
      if (node.children.length > 0) {
        allIds.add(node.id)
        node.children.forEach(collect)
      }
    }
    collect(knowledgeData)
    setExpandedIds(allIds)
  }, [])

  // 收起全部
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set(['root']))
  }, [])

  // 选中节点（选中父节点时同时选中所有子节点）
  const handleSelect = useCallback((id: string) => {
    const findNodeRecursive = (node: MindMapNode, targetId: string): MindMapNode | null => {
      if (node.id === targetId)
        return node
      for (const child of node.children) {
        const found = findNodeRecursive(child, targetId)
        if (found)
          return found
      }
      return null
    }

    const getDescendantIds = (node: MindMapNode): string[] => {
      const ids: string[] = []
      const collect = (n: MindMapNode) => {
        for (const child of n.children) {
          ids.push(child.id)
          collect(child)
        }
      }
      collect(node)
      return ids
    }

    const clickedNode = findNodeRecursive(knowledgeData, id)
    if (!clickedNode)
      return

    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        // 取消选中时，同时取消所有子节点
        getDescendantIds(clickedNode).forEach(childId => newSet.delete(childId))
        newSet.delete(id)
      }
      else {
        // 选中时，同时选中所有子节点
        newSet.add(id)
        getDescendantIds(clickedNode).forEach(childId => newSet.add(childId))
      }
      return newSet
    })
  }, [])

  // 获取选中节点路径
  const selectedNodesWithPath = useMemo(() => {
    const findPath = (node: MindMapNode, targetId: string, path: string[] = []): string[] | null => {
      const currentPath = [...path, node.name]
      if (node.id === targetId)
        return currentPath
      for (const child of node.children) {
        const found = findPath(child, targetId, currentPath)
        if (found)
          return found
      }
      return null
    }

    return Array.from(selectedIds)
      .filter(id => id !== 'root')
      .map(id => {
        const path = findPath(knowledgeData, id) || [id]
        return { id, path: path.join(' > ') }
      })
  }, [selectedIds])

  // 确认选择
  const handleConfirm = () => {
    selectedNodesWithPath.forEach(node => {
      onNodeSelect?.(node.id, node.path)
    })
    setSelectedIds(new Set())
    onHide()
  }

  // 清空选择
  const handleClear = () => {
    setSelectedIds(new Set())
  }

  return (
    <Dialog open={isShow} onOpenChange={open => !open && onHide()}>
      <DialogContent className="max-h-[85vh] w-[600px] overflow-hidden !p-0 flex flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-divider-subtle px-6 py-4">
          <div>
            <div className="system-xl-semibold text-text-primary">选择知识体系</div>
            {selectedIds.size > 0 && (
              <div className="system-xs-regular text-text-tertiary mt-1">
                已选择 {selectedIds.size - 1} 个节点
              </div>
            )}
          </div>
          <DialogCloseButton onClick={onHide} />
        </div>

        {/* 工具栏 */}
        <div className="flex shrink-0 items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">点击节点可选中/取消</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-xs text-[#2d99d7] hover:bg-blue-50 rounded transition-colors"
            >
              展开全部
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              收起全部
            </button>
          </div>
        </div>

        {/* 树形结构 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div
            className="inline-block min-w-full"
            style={{
              backgroundColor: '#2d99d7',
              borderRadius: 12,
              padding: '16px 8px',
            }}
          >
            <TreeNode
              node={knowledgeData}
              level={0}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* 选中标签 */}
        {selectedNodesWithPath.length > 0 && (
          <div className="shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-100 max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {selectedNodesWithPath.map(node => (
                <div
                  key={node.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#d1fae5] text-[#065f46] text-xs rounded-full"
                >
                  <span className="max-w-48 truncate">{node.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-divider-subtle">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            清空选择
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onHide}
              className="px-4 py-2 text-sm text-text-secondary border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedNodesWithPath.length === 0}
              className="px-4 py-2 text-sm text-white bg-[#10b981] rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认选择 ({selectedNodesWithPath.length})
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SelectMindMap
