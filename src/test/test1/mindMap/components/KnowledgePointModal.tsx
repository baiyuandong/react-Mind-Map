import type { Points } from '../types'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import useMindMapStore from '../store'
import { v4 as uuidv4 } from 'uuid'
import { useAppContext } from '@/context/app-context'
import { useSearchParams } from '@/next/navigation'
import {
  useCreateSinglePoint,
  useBatchCreatePoints,
  useUpdatePointBinding,
} from '@/service/knowledgeSystem/use-knowledge'
import { toast } from '@/app/components/base/ui/toast'

const KnowledgePointModal: React.FC = () => {
  const knowledgePointModalShow = useMindMapStore(s => s.knowledgePointModalShow)
  const knowledgePointNodeId = useMindMapStore(s => s.knowledgePointNodeId)
  const toggleKnowledgePointModal = useMindMapStore(s => s.toggleKnowledgePointModal)
  const addKnowledgePoint = useMindMapStore(s => s.addKnowledgePoint)
  const updateKnowledgePoint = useMindMapStore(s => s.updateKnowledgePoint)
  const deleteKnowledgePoint = useMindMapStore(s => s.deleteKnowledgePoint)
  const mindmap = useMindMapStore(s => s.mindmap)

  const { currentWorkspace } = useAppContext()
  const searchParams = useSearchParams()
  const tenantId = currentWorkspace?.id || ''
  const systemId = searchParams ? searchParams.get('systemId') || '' : ''

  const createSinglePointMutation = useCreateSinglePoint()
  const batchCreatePointsMutation = useBatchCreatePoints()
  const updatePointBindingMutation = useUpdatePointBinding()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingPointId, setEditingPointId] = useState<string | null>(null)
  const [nodeTitle, setNodeTitle] = useState('')
  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single')
  const [batchContent, setBatchContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // All hooks before any early return — React rules of hooks
  const batchPreviewPoints = useMemo(() => {
    if (inputMode !== 'batch' || !batchContent.trim())
      return []
    return batchContent
      .split('\n')
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed)
          return null
        const separatorMatch = trimmed.match(/^(.+?)[:\s]\s*(.*)$/)
        if (separatorMatch) {
          const pTitle = separatorMatch[1].trim()
          if (!pTitle)
            return null
          return {
            id: uuidv4(),
            title: pTitle,
            content: separatorMatch[2].trim(),
          }
        }
        return {
          id: uuidv4(),
          title: trimmed,
          content: '',
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null && p.title !== '')
  }, [batchContent, inputMode])

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
      setNodeTitle(node?.name || '')
    }
  }, [knowledgePointModalShow, knowledgePointNodeId, mindmap])

  useEffect(() => {
    if (!knowledgePointModalShow) {
      setTitle('')
      setContent('')
      setEditingPointId(null)
      setInputMode('single')
      setBatchContent('')
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
  const points = currentNode?.points || []

  const handleSave = async () => {
    if (isSubmitting)
      return

    if (inputMode === 'single') {
      if (!title.trim())
        return
      setIsSubmitting(true)
      try {
        if (editingPointId) {
          // 编辑已有知识点 -> 调用更新接口
          await updatePointBindingMutation.mutateAsync({
            tenantId,
            systemId,
            bindingId: editingPointId,
            data: {
              name: title.trim(),
              description: content.trim(),
            },
          })
          updateKnowledgePoint(knowledgePointNodeId, editingPointId, { name: title.trim(), description: content.trim() })
        }
        else {
          // 新增知识点 -> 调用创建接口
          const res = await createSinglePointMutation.mutateAsync({
            tenantId,
            systemId,
            nodeId: knowledgePointNodeId,
            data: {
              name: title.trim(),
              description: content.trim(),
            },
          })
          const newPoint: Points = {
            id: res.data?.binding_id ?? uuidv4(),
            name: title.trim(),
            description: content.trim(),
          }
          addKnowledgePoint(knowledgePointNodeId, newPoint)
        }
        setTitle('')
        setContent('')
        setEditingPointId(null)
      }
      catch (err: any) {
        toast.error(err?.data || '保存失败，请重试')
      }
      finally {
        setIsSubmitting(false)
      }
    }
    else {
      if (!batchContent.trim())
        return
      setIsSubmitting(true)
      try {
        // 批量添加 -> 调用批量创建接口
        await batchCreatePointsMutation.mutateAsync({
          tenantId,
          systemId,
          nodeId: knowledgePointNodeId,
          data: {
            text: batchContent.trim(),
          },
        })
        // 将解析后的知识点逐个添加到本地 store
        const lines = batchContent.split('\n').filter(line => line.trim())
        lines.forEach((line) => {
          const trimmed = line.trim()
          const separatorIndex = trimmed.indexOf(' ')
          let pointTitle: string
          let pointContent: string
          if (separatorIndex === -1) {
            pointTitle = trimmed
            pointContent = ''
          }
          else {
            pointTitle = trimmed.slice(0, separatorIndex).trim()
            pointContent = trimmed.slice(separatorIndex + 1).trim()
          }
          if (pointTitle) {
            const newPoint: Points = {
              id: uuidv4(),
              name: pointTitle,
              description: pointContent,
            }
            addKnowledgePoint(knowledgePointNodeId, newPoint)
          }
        })
        setBatchContent('')
      }
      catch (err: any) {
        toast.error(err?.data || '批量添加失败，请重试')
      }
      finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleEdit = (point: Points) => {
    setTitle(point.name)
    setContent(point.description)
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
            {/* Mode Toggle Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setInputMode('single')}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  backgroundColor: inputMode === 'single' ? '#2d99d7' : '#f0f0f0',
                  color: inputMode === 'single' ? '#fff' : '#333',
                  transition: 'all 0.2s',
                }}
              >
                单行添加
              </button>
              <button
                onClick={() => setInputMode('batch')}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  backgroundColor: inputMode === 'batch' ? '#2d99d7' : '#f0f0f0',
                  color: inputMode === 'batch' ? '#fff' : '#333',
                  transition: 'all 0.2s',
                }}
              >
                批量添加
              </button>
            </div>

            {inputMode === 'single' ? (
              <>
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
                <div style={{ marginTop: 12 }}>
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
              </>
            ) : (
              <textarea
                placeholder="每行一个知识点，可包含标题和内容（用:或空格分隔）&#10;例如：&#10;标题1:内容1&#10;标题2 内容2"
                value={batchContent}
                onChange={e => setBatchContent(e.target.value)}
                rows={8}
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
                  lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = '#2d99d7'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { handleCancel(); toggleKnowledgePointModal(false); }}
              style={{
                padding: '8px 20px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #e6e6e6',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || (inputMode === 'single' ? !title.trim() : !batchContent.trim())}
              style={{
                padding: '8px 20px',
                backgroundColor: isSubmitting || (inputMode === 'single' ? !title.trim() : !batchContent.trim()) ? '#ccc' : '#2d99d7',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: isSubmitting || (inputMode === 'single' ? !title.trim() : !batchContent.trim()) ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {isSubmitting ? '提交中...' : (inputMode === 'single' ? (editingPointId ? '保存' : '添加') : '批量添加')}
            </button>
          </div>

          {/* Batch Mode Preview */}
          {inputMode === 'batch' && batchPreviewPoints.length > 0 && (
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                批量预览 ({batchPreviewPoints.length})
                <span style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: '#999',
                }}>
                  （确认后点击"批量添加"）
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {batchPreviewPoints.map(point => (
                  <div
                    key={point.id}
                    style={{
                      padding: 10,
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#333', flex: 1 }}>
                        {point.title}
                      </div>
                    </div>
                    {point.content && (
                      <div style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
                        {point.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* <> 
            {inputMode === 'single' && points.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                  已有知识点 ({points.length})
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
                          {point.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => handleEdit(point)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: 12,
                              color: '#2d99d7',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(point.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: 12,
                              color: '#e74c3c',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      {point.description && (
                        <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                          {point.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </> */}
        </div>
      </div>
    </div>
  )
}

export default KnowledgePointModal
