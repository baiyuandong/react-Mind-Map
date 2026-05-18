import React, { useEffect, useRef } from 'react'
import MindMapNodeRenderer from './Node'
import SubNode from './SubNode'
import { ROOT_PARENT } from '../types'
import type { MindMapNode } from '../types'

interface RootNodeProps {
  node: MindMapNode
  nodeRefs: Set<React.RefObject<HTMLDivElement | null>>
}

const RootNode: React.FC<RootNodeProps> = ({ node, nodeRefs }) => {
  const rootNodeRef = useRef<HTMLDivElement>(null)

  const total = node.children.length
  const half = total > 3 ? Math.trunc(total / 2) : total

  // 载入时使根节点居中
  useEffect(() => {
    rootNodeRef.current?.scrollIntoView({ block: 'center', inline: 'center' })
  }, [])

  const leftChildren = node.showChildren ? node.children.slice(half) : []
  const rightChildren = node.showChildren ? node.children.slice(0, half) : []

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}>
      {/* 左侧分支 */}
      <div>
        {leftChildren.map((subNode) => (
          <SubNode
            key={subNode.id}
            layer={1}
            node={subNode}
            nodeRefs={nodeRefs}
            parent={node}
            onLeft={true}
          />
        ))}
      </div>

      {/* 根节点 */}
      <div ref={rootNodeRef}>
        <MindMapNodeRenderer
          layer={0}
          node={node}
          nodeRefs={nodeRefs}
          parent={ROOT_PARENT}
        />
      </div>

      {/* 右侧分支 */}
      <div>
        {rightChildren.map((subNode) => (
          <SubNode
            key={subNode.id}
            layer={1}
            node={subNode}
            nodeRefs={nodeRefs}
            parent={node}
            onLeft={false}
          />
        ))}
      </div>
    </div>
  )
}

export default RootNode
