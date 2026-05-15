import React from 'react'
import MindMapNodeRenderer from './Node'
import type { MindMapNode } from '../types'

interface SubNodeProps {
  layer: number
  node: MindMapNode
  nodeRefs: Set<React.RefObject<HTMLDivElement | null>>
  parent: MindMapNode
  onLeft: boolean
}

const SubNode: React.FC<SubNodeProps> = ({ layer, node, nodeRefs, parent, onLeft }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: onLeft ? 'row-reverse' : 'row',
      }}
    >
      <MindMapNodeRenderer
        layer={layer}
        node={node}
        nodeRefs={nodeRefs}
        parent={parent}
        onLeft={onLeft}
      />
      <div>
        {node.showChildren &&
          node.children.map((subNode) => (
            <SubNode
              key={subNode.id}
              layer={layer + 1}
              node={subNode}
              nodeRefs={nodeRefs}
              parent={node}
              onLeft={onLeft}
            />
          ))}
      </div>
    </div>
  )
}

export default SubNode
