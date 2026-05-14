import type { KnowledgePoint } from '../types'
import * as React from 'react'
import { useEffect, useState } from 'react'
import useMindMapStore from '../store'
import { v4 as uuidv4 } from 'uuid'

const KnowledgePointModal: React.FC = () => {
  const knowledgePointModalShow = useMindMapStore(s => s.knowledgePointModalShow)
  const knowledgePointNodeId = useMindMapStore(s => s.knowledgePointNodeId)
  const toggleKnowledgePointModal = useMindMapStore(s => s.toggleKnowledgePointModal)
  const addKnowledgePoint = useMindMapStore(s => s.addKnowledgePoint)
  const updateKnowledgePoint = useMindMapStore(s => s.updateKnowledgePoint)
  const deleteKnowledgePoint = useMindMapStore(s => s.deleteKnowledgePoint)
  const mindmap = useMindMapStore(s => s.mindmap)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingPointId, setEditingPointId] = useState<string | null>(null)
  const [nodeTitle, setNodeTitle] = useState('')

  useEffect(() => {
    if (knowledgePointModalShow && knowledgePointNodeId) {
      const findNodeInfo = (node: typeof mindmap): typeof mindmap | null => {
        if (node.id === knowledgePointNodeId)
          return node
        for (const child of node.children) {
          const found = findNodeInfo(child)
          if (found)
            return found
        }
        return null
      }
      const node = findNodeInfo(mindmap)
      setNodeTitle(node?.text || '')
    }
  }, [knowledgePointModalShow, knowledgePointNodeId, mindmap])

  useEffect(() => {
    if (!knowledgePointModalShow) {
      setTitle('')
      setContent('')
      setEditingPointId(null)
    }
  }, [knowledgePointModalShow])

  if (!knowledgePointModalShow)
    return null

  const findNode = (node: typeof mindmap): typeof mindmap | null => {
    if (node.id === knowledgePointNodeId)
      return node
    for (const child of node.children) {
      const found = findNode(child)
      if (found)
        return found
    }
    return null
  }

  const currentNode = findNode(mindmap)
  const points = currentNode?.knowledgePoints || []

  const handleSave = () => {
    if (!title.trim())
      return
    if (editingPointId) {
      updateKnowledgePoint(knowledgePointNodeId, editingPointId, { title, content })
    }
    else {
      const newPoint: KnowledgePoint = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
      }
      addKnowledgePoint(knowledgePointNodeId, newPoint)
    }
    setTitle('')
    setContent('')
    setEditingPointId(null)
  }

  const handleEdit = (point: KnowledgePoint) => {
    setTitle(point.title)
    setContent(point.content)
    setEditingPointId(point.id)
  }

  const handleDelete = (pointId: string) => {
    deleteKnowledgePoint(knowledgePointNodeId, pointId)
    if (editingPointId === pointId) {
      setTitle('')
      setContent('')
      setEditingPointId(null)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setContent('')
    setEditingPointId(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => toggleKnowledgePointModal(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 600,
          maxHeight: '80vh',
          backgroundColor: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>知识点管理</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              所属节点：{nodeTitle}
            </div>
          </div>
          <button
            onClick={() => toggleKnowledgePointModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#888',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
          {/* Input Form */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="请输入知识点标题"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#2d99d7'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <textarea
              placeholder="请输入知识点内容"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#2d99d7'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                padding: '8px 20px',
                backgroundColor: title.trim() ? '#2d99d7' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontSize: 14,
              }}
            >
              {editingPointId ? '更新' : '添加'}
            </button>
            {editingPointId && (
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消编辑
              </button>
            )}
          </div>

          {/* Points List */}
          {points.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                已添加知识点 ({points.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {points.map(point => (
                  <div
                    key={point.id}
                    style={{
                      padding: 12,
                      border: '1px solid #eee',
                      borderRadius: 8,
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#333', flex: 1 }}>
                        {point.title}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEdit(point)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#fff',
                            color: '#2d99d7',
                            border: '1px solid #2d99d7',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(point.id)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#fff',
                            color: '#ff4c26',
                            border: '1px solid #ff4c26',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    {point.content && (
                      <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                        {point.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KnowledgePointModal
