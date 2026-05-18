import React from 'react'
import useMindMapStore from '../store'
import { findNode } from '../utils/assistFunctions'
import type { MindMapNode } from '../types'

/**
 * 递归搜索节点，返回匹配的节点以及从根到该节点的路径（祖先链）
 * 返回格式：{ node, path: [ancestor, ..., node] }
 */
function searchNodesWithPath(node: MindMapNode, keyword: string, parentPath: MindMapNode[] = []): { node: MindMapNode; path: MindMapNode[] }[] {
  if (!node || !keyword.trim()) return []
  const results: { node: MindMapNode; path: MindMapNode[] }[] = []
  const lowerKeyword = keyword.toLowerCase()
  const currentPath = [...parentPath, node]

  if (node.name && node.name.toLowerCase().includes(lowerKeyword)) {
    results.push({ node, path: currentPath })
  }
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      results.push(...searchNodesWithPath(child, keyword, currentPath))
    })
  }
  return results
}

/**
 * 判断是否有同名节点（用于决定是否显示路径信息）
 */
function hasSameNameNodes(allResults: { node: MindMapNode }[]): boolean {
  if (allResults.length <= 1) return false
  const textCount: Record<string, number> = {}
  allResults.forEach((r) => {
    textCount[r.node.name] = (textCount[r.node.name] || 0) + 1
  })
  return Object.values(textCount).some((c) => c > 1)
}

interface SearchItem {
  node: MindMapNode
  path: MindMapNode[]
}

const SearchBox: React.FC = () => {
  const mindmap = useMindMapStore((s) => s.mindmap)
  const toggleChildren = useMindMapStore((s) => s.toggleChildren)
  const selectNode = useMindMapStore((s) => s.selectNode)

  const [keyword, setKeyword] = React.useState('')
  const [results, setResults] = React.useState<SearchItem[]>([])
  const [showResults, setShowResults] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    if (val.trim()) {
      const found = searchNodesWithPath(mindmap, val)
      setResults(found)
      setShowResults(true)
      setActiveIndex(-1)
    }
    else {
      setResults([])
      setShowResults(false)
    }
  }

  const handleFocus = () => {
    if (keyword.trim() && results.length > 0) {
      setShowResults(true)
    }
  }

  const handleSelect = (item: SearchItem) => {
    // 展开所有祖先节点（确保目标节点可见）
    const { node, path } = item
    path.forEach((p) => {
      if (!p.showChildren) {
        toggleChildren(p.id, true)
      }
    })
    // 选中目标节点（触发 scrollIntoView 居中）
    selectNode(node.id)
    // 关闭下拉、清空搜索
    setShowResults(false)
    setKeyword('')
    setResults([])
    if (inputRef.current) inputRef.current.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex])
      }
    }
    else if (e.key === 'Escape') {
      setShowResults(false)
      if (inputRef.current) inputRef.current.blur()
    }
  }

  const handleClear = () => {
    setKeyword('')
    setResults([])
    setShowResults(false)
    if (inputRef.current) inputRef.current.focus()
  }

  // 点击外部关闭下拉
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showFullPath = hasSameNameNodes(results)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 260,
        height: 34,
        background: keyword ? '#ffffff' : '#f5f5f5',
        borderRadius: 8,
        padding: '0 10px',
        marginLeft: 16,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#999"
        strokeWidth={2}
        style={{ width: 16, height: 16, marginRight: 6, flexShrink: 0 }}
      >
        <circle cx={10.5} cy={10.5} r={7.5} />
        <line x1={16.5} y1={16.5} x2={22} y2={22} />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索节点…"
        value={keyword}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 14,
          color: '#333',
        }}
      />
      {keyword && (
        <button
          onClick={handleClear}
          title="清空"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#999',
            fontSize: 14,
            borderRadius: '50%',
            flexShrink: 0,
            padding: 0,
          }}
        >
          ✕
        </button>
      )}

      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          style={{
            position: 'fixed',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            maxHeight: 360,
            background: '#ffffff',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)',
            overflowY: 'auto',
            zIndex: 9999,
            padding: '6px 0',
          }}
        >
          <div
            style={{
              padding: '6px 14px 4px',
              fontSize: 12,
              color: '#999',
              borderBottom: '1px solid #f0f0f0',
              marginBottom: 4,
            }}
          >
            找到 {results.length} 个节点
          </div>
          {results.map((item, index) => {
            const { node, path } = item
            const pathStr = showFullPath
              ? path.slice(0, -1).map((p) => p.name).join(' › ')
              : ''
            return (
              <div
                key={node.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#333',
                  background: index === activeIndex ? '#e8f0fe' : 'transparent',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#bbb"
                  strokeWidth={2}
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                >
                  <rect x={4} y={4} width={16} height={16} rx={2} />
                </svg>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                  >
                    {node.name || '(无文本)'}
                  </span>
                  {showFullPath && pathStr && (
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 11,
                        color: '#999',
                      }}
                    >
                      {pathStr}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showResults && keyword.trim() && results.length === 0 && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            background: '#ffffff',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)',
            zIndex: 9999,
            padding: '16px 14px',
            textAlign: 'center',
            fontSize: 13,
            color: '#999',
          }}
        >
          未找到匹配节点
        </div>
      )}
    </div>
  )
}

export default SearchBox
