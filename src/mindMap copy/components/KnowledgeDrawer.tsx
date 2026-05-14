'use client'

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
import { useTranslation } from 'react-i18next'
import useMindMapStore from '../store'
import { findNode } from '../utils/assistFunctions'

const KnowledgeDrawer: React.FC = () => {
  const { t } = useTranslation()

  const knowledgeDrawerShow = useMindMapStore(s => s.knowledgeDrawerShow)
  const knowledgeDrawerNodeId = useMindMapStore(s => s.knowledgeDrawerNodeId)
  const mindmap = useMindMapStore(s => s.mindmap)
  const toggleKnowledgeDrawer = useMindMapStore(s => s.toggleKnowledgeDrawer)

  const node = knowledgeDrawerNodeId ? findNode(mindmap, knowledgeDrawerNodeId) : null
  const knowledgePoints = node?.knowledgePoints || []

  const handleClose = () => {
    toggleKnowledgeDrawer(false)
  }

  return (
    <Drawer
      open={knowledgeDrawerShow}
      onOpenChange={handleClose}
      modal
      swipeDirection="right"
    >
      <DrawerPortal>
        <DrawerBackdrop className="bg-black/20 backdrop-blur-[2px]" />
        <DrawerViewport>
          <DrawerPopup
            className="top-0 right-0 bottom-0 w-[420px] max-w-full rounded-none"
            style={{
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            <DrawerContent className="flex h-full flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-b-[#e5e7eb]">
                <DrawerTitle className="text-base font-semibold text-text-primary truncate pr-4">
                  {node?.text || '知识点详情'}
                </DrawerTitle>
                <DrawerCloseButton aria-label="关闭" />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {knowledgePoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#9ca3af]">
                    <svg
                      className="w-12 h-12 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm">暂无知识点</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {knowledgePoints.map((point: KnowledgePoint, index: number) => (
                      <KnowledgeCard key={point.id} point={point} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  )
}

type KnowledgeCardProps = {
  point: KnowledgePoint
  index: number
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ point, index }) => {
  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-linear-to-r to-white from-gray-50 border-b border-b-[#f3f4f6]">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #2d99d7 0%, #1a7ab8 100%)',
          }}
        >
          {index + 1}
        </div>
        <h3 className="flex-1 text-sm font-medium text-text-primary line-clamp-2">
          {point.title}
        </h3>
      </div>

      {/* Card Content */}
      <div className="px-4 py-3">
        <div
          className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap"
          style={{
            maxHeight: 'none',
            overflow: 'visible',
          }}
        >
          {point.content}
        </div>
      </div>
    </div>
  )
}

export default KnowledgeDrawer
