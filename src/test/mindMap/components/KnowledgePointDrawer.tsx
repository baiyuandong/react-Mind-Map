'use client'

import type { FC } from 'react'
import type { KnowledgePoint } from '../types'
import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerContent,
  DrawerPopup,
  DrawerPortal,
  DrawerTitle,
  DrawerViewport,
} from '@langgenius/dify-ui/drawer'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'

type KnowledgePointDrawerProps = {
  open: boolean
  onClose: () => void
  nodeName: string
  knowledgePoints: KnowledgePoint[]
  onAdd: (point: Omit<KnowledgePoint, 'id'>) => void
  onDelete: (id: string) => void
  onEdit: (point: KnowledgePoint) => void
}

const KnowledgePointDrawer: FC<KnowledgePointDrawerProps> = ({
  open,
  onClose,
  nodeName,
  knowledgePoints,
  onAdd,
  onDelete,
  onEdit,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [editingPoint, setEditingPoint] = useState<KnowledgePoint | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const filteredPoints = useMemo(() => {
    if (!searchKeyword.trim())
      return knowledgePoints
    const keyword = searchKeyword.toLowerCase()
    return knowledgePoints.filter(
      point =>
        point.title.toLowerCase().includes(keyword)
        || point.content.toLowerCase().includes(keyword),
    )
  }, [knowledgePoints, searchKeyword])

  const handleAdd = useCallback(() => {
    if (newTitle.trim()) {
      onAdd({
        title: newTitle.trim(),
        content: '',
      })
      setNewTitle('')
    }
  }, [newTitle, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTitle.trim()) {
      handleAdd()
    }
  }

  const handleStartEdit = (point: KnowledgePoint) => {
    setEditingPoint(point)
    setEditTitle(point.title)
    setEditContent(point.content)
  }

  const handleCancelEdit = () => {
    setEditingPoint(null)
    setEditTitle('')
    setEditContent('')
  }

  const handleSaveEdit = () => {
    if (editingPoint && editTitle.trim()) {
      onEdit({
        ...editingPoint,
        title: editTitle.trim(),
        content: editContent.trim(),
      })
      handleCancelEdit()
    }
  }

  return (
    <Drawer
      open={open}
      modal
      swipeDirection="right"
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
          setSearchKeyword('')
          setNewTitle('')
          handleCancelEdit()
        }
      }}
    >
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup className="data-[swipe-direction=right]:top-2 data-[swipe-direction=right]:bottom-2 data-[swipe-direction=right]:h-[calc(100dvh-16px)] data-[swipe-direction=right]:w-full data-[swipe-direction=right]:max-w-[480px]">
            <DrawerContent className="flex min-h-0 flex-1 flex-col p-0">
              {/* Header */}
              <div className="flex shrink-0 flex-col gap-2 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <DrawerTitle className="truncate pr-4 text-lg leading-6 font-medium text-text-primary">
                    {nodeName || '知识点'}
                  </DrawerTitle>
                  <DrawerCloseButton
                    aria-label="关闭"
                    className="h-6 w-6 shrink-0 rounded-md"
                  />
                </div>
                <div className="text-xs text-text-tertiary">
                  知识点
                  {' '}
                  {knowledgePoints.length}
                  {' '}
                  个
                </div>
              </div>

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
                                      {/* Edit indicator */}
                                      <div className="mb-3 text-xs text-text-tertiary">
                                        编辑知识点
                                      </div>

                                      {/* Title input */}
                                      <div className="mb-3">
                                        <input
                                          type="text"
                                          value={editTitle}
                                          onChange={e => setEditTitle(e.target.value)}
                                          className="bg-components-panel-on-panel-bg w-full rounded-lg border border-components-panel-border px-3 py-2 text-sm text-text-primary outline-none focus:border-components-input-border-active"
                                        />
                                      </div>

                                      {/* Content textarea */}
                                      <div className="mb-3">
                                        <textarea
                                          value={editContent}
                                          onChange={e => setEditContent(e.target.value)}
                                          rows={3}
                                          className="bg-components-panel-on-panel-bg w-full resize-none rounded-lg border border-components-panel-border px-3 py-2 text-sm text-text-primary outline-none focus:border-components-input-border-active"
                                        />
                                      </div>

                                      {/* Action buttons */}
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
                                            {point.title}
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
{point.content && (
                                    <p className="line-clamp-2 pl-7 text-xs leading-relaxed text-text-secondary">
                                      {point.content}
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

              {/* Fixed footer */}
              <div className="shrink-0 border-t border-components-panel-border-subtle bg-components-panel-on-panel-item-bg p-4">
                {/* Quick add */}
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

                {/* Batch add */}
                <button
                  type="button"
                  className="hover:bg-background-section-hover w-full rounded-lg border border-dashed border-components-panel-border py-2 text-center text-sm text-text-secondary transition-colors hover:border-components-input-border-active hover:text-text-primary"
                >
                  批量添加多行
                </button>
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  )
}

export default React.memo(KnowledgePointDrawer)
