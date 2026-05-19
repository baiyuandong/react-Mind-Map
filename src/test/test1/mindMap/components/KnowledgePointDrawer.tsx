'use client'

import type { FC } from 'react'
import type { Points } from '../types'
import Drawer from './ui/drawer'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'

type KnowledgePointDrawerProps = {
  open: boolean
  onClose: () => void
  nodeName: string
  points: Points[]
  onAdd: (point: Omit<Points, 'id'>) => void
  onDelete: (id: string) => void
  onEdit: (point: Points) => void
}

const KnowledgePointDrawer: FC<KnowledgePointDrawerProps> = ({
  open,
  onClose,
  nodeName,
  points,
  onAdd,
  onDelete,
  onEdit,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [editingPoint, setEditingPoint] = useState<Points | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const filteredPoints = useMemo(() => {
    if (!searchKeyword.trim())
      return points
    const keyword = searchKeyword.toLowerCase()
    return points.filter(
      point =>
        point.name.toLowerCase().includes(keyword)
        || (point.description?.toLowerCase() ?? '').includes(keyword),
    )
  }, [points, searchKeyword])

  const handleAdd = useCallback(() => {
    if (newTitle.trim()) {
      onAdd({
        name: newTitle.trim(),
        description: '',
      })
      setNewTitle('')
    }
  }, [newTitle, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTitle.trim()) {
      handleAdd()
    }
  }

  const handleStartEdit = (point: Points) => {
    setEditingPoint(point)
    setEditTitle(point.name)
    setEditContent(point.description)
  }

  const handleCancelEdit = useCallback(() => {
    setEditingPoint(null)
    setEditTitle('')
    setEditContent('')
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    setSearchKeyword('')
    setNewTitle('')
    handleCancelEdit()
  }, [onClose, handleCancelEdit])

  const handleSaveEdit = () => {
    if (editingPoint && editTitle.trim()) {
      onEdit({
        ...editingPoint,
        name: editTitle.trim(),
        description: editContent.trim(),
      })
      handleCancelEdit()
    }
  }

  const headerContent = (
    <div className="flex items-center justify-between">
      <h3 className="truncate pr-4 text-lg leading-6 font-medium text-text-primary">
        {nodeName || '知识点'}
      </h3>
    </div>
  )

  const subTitleContent = (
    <div className="text-xs text-text-tertiary">
      知识点
      {' '}
      {points.length}
      {' '}
      个
    </div>
  )

  const bodyContent = (
    <>
      {/* Search */}
      <div className="shrink-0 px-6 pb-4">
        <div className="bg-components-panel-on-panel-bg flex items-center gap-2 rounded-lg border border-components-panel-border px-3 py-2">
          <span className="i-ri-search-line size-4 shrink-0 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索知识点…"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-quaternary"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="flex size-4 items-center justify-center text-text-tertiary hover:text-text-primary"
            >
              <span className="i-carbon-close size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6">
        {filteredPoints.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <span className="mb-2 i-ri-file-list-3-line size-12" />
              <span className="text-sm">
                {searchKeyword ? '未找到匹配的知识点' : '暂无知识点'}
              </span>
            </div>
          )
          : (
            <div className="space-y-2 pb-4">
              {filteredPoints.map((point, index) => {
                const pointIndex = index + 1
                return (
                  <div key={point.id}>
                    {editingPoint?.id === point.id
                      ? (
                        <div className="rounded-lg border border-components-input-border-active bg-components-panel-on-panel-item-bg p-4">
                          <div className="mb-3 text-xs text-text-tertiary">
                            编辑知识点
                          </div>
                          <div className="mb-3">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="bg-components-panel-on-panel-bg w-full rounded-lg border border-components-panel-border px-3 py-2 text-sm text-text-primary outline-none focus:border-components-input-border-active"
                            />
                          </div>
                          <div className="mb-3">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={3}
                              className="bg-components-panel-on-panel-bg w-full resize-none rounded-lg border border-components-panel-border px-3 py-2 text-sm text-text-primary outline-none focus:border-components-input-border-active"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="hover:bg-background-section-hover rounded-lg border border-components-panel-border bg-components-panel-on-panel-item-bg px-4 py-1.5 text-sm text-text-secondary transition-colors"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={!editTitle.trim()}
                              className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-1.5 text-sm text-white transition-colors hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="i-ri-check-line size-4" />
                              保存
                            </button>
                          </div>
                        </div>
                      )
                      : (
                        <div className="group/item rounded-lg border border-components-panel-border-subtle bg-components-panel-on-panel-item-bg p-3 transition-colors hover:border-components-panel-border">
                          <div className="mb-1 flex items-start justify-between">
                            <div className="flex flex-1 items-start gap-2">
                              <span className="bg-components-panel-on-panel-bg flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium text-text-tertiary">
                                {pointIndex}
                              </span>
                              <h4 className="line-clamp-1 flex-1 pr-2 text-sm font-semibold text-text-primary">
                                {point.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(point)}
                                className="flex size-6 items-center justify-center rounded-md text-text-tertiary hover:bg-state-base-hover hover:text-text-primary"
                                title="编辑"
                              >
                                <span className="i-ri-edit-line size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(point.id)}
                                className="flex size-6 items-center justify-center rounded-md text-text-tertiary hover:bg-state-destructive-hover hover:text-text-destructive"
                                title="删除"
                              >
                                <span className="i-ri-delete-bin-line size-4" />
                              </button>
                            </div>
                          </div>
                          {point.description && (
                            <p className="line-clamp-2 pl-7 text-xs leading-relaxed text-text-secondary">
                              {point.description}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </>
  )

  const footContent = (
    <>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="输入知识点标题，按回车添加"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-components-panel-on-panel-bg flex-1 rounded-lg border border-components-panel-border px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-quaternary focus:border-components-input-border-active"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-components-button-secondary-bg px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="i-ri-add-line size-4" />
          <span>添加</span>
        </button>
      </div>

      <button
        type="button"
        className="hover:bg-background-section-hover w-full rounded-lg border border-dashed border-components-panel-border py-2 text-center text-sm text-text-secondary transition-colors hover:border-components-input-border-active hover:text-text-primary"
      >
        批量添加多行
      </button>
    </>
  )

  return (
    <Drawer
      isShow={open}
      onHide={handleClose}
      direction="right"
      title={headerContent}
      titleDescription={subTitleContent}
      panelClassName="!p-0"
      headerClassName="!border-b-0 !pb-0"
      body={bodyContent}
      foot={footContent}
    />
  )
}

export default React.memo(KnowledgePointDrawer)
