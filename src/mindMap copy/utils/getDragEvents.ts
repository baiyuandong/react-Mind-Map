import type { MindMapNode, Theme } from '../types'
import { DROP_AREA, LEFT_NODE } from '../types'
import { findNode } from './assistFunctions'
import { drawDragCanvas } from './drawCanvas'

type DragHandlers = {
  type: string
  listener: EventListenerOrEventListenerObject
}

type MoveXY = {
  x: number
  y: number
}

function getDomOffset(dom: HTMLElement) {
  const left = dom.offsetLeft
  const right = left + dom.offsetWidth
  const top = dom.offsetTop
  const bottom = top + dom.offsetHeight
  return { left, right, top, bottom }
}

export default function getDragEvents(
  mindmap: MindMapNode,
  dragCanvas: HTMLCanvasElement | null,
  container: HTMLElement | null,
  theme: Theme,
  mindmapHook: { moveNode: (nodeId: string, targetId: string, parentId: string, isSibling: boolean) => void },
  zoom: number,
  drag: MoveXY,
): DragHandlers[] {
  if (!dragCanvas || !container)
    return []

  let nodeId = ''
  let parentId = ''
  let targetId = ''
  let isSibling = false

  let children: string[][] = []
  let childrenOffsetLeft: number[] = []
  let childrenOffsetRight: number[] = []
  let childrenOffsetVertical: number[][] = []
  let parentOffset: ReturnType<typeof getDomOffset> | undefined
  let parentIsRoot = false

  let containerLeft = container.scrollLeft
  let containerTop = container.scrollTop - 56
  const containerWidth = container.offsetWidth
  const containerHeight = container.offsetHeight

  let inDropArea = false

  const resetVariables = () => {
    nodeId = ''
    parentId = ''
    targetId = ''
    isSibling = false
    children = []
    childrenOffsetLeft = []
    childrenOffsetRight = []
    childrenOffsetVertical = []
    parentOffset = undefined
    parentIsRoot = false
    inDropArea = false
  }

  const handleContainerScroll = () => {
    containerLeft = container!.scrollLeft
    containerTop = container!.scrollTop - 56
  }

  const events: DragHandlers[] = [
    {
      type: 'dragstart',
      listener: ((event: DragEvent) => {
        resetVariables()
        container!.addEventListener('scroll', handleContainerScroll)

        const target = event.target as HTMLElement | null
        if (target && (target.dataset.tag === LEFT_NODE || target.dataset.tag === RIGHT_NODE)) {
          nodeId = target.id
          parentId = target.dataset.parent || ''
          const parent = findNode(mindmap, parentId)
          if (parent) {
            parentIsRoot = parent === mindmap
            const parentDom = document.getElementById(parentId)
            if (parentDom)
              parentOffset = getDomOffset(parentDom)

            children[0] = parent.children.map(child => child.id)
            let childrenOffset: ReturnType<typeof getDomOffset>[][] = []
            childrenOffset[0] = children[0].map(nodeId => getDomOffset(document.getElementById(nodeId) as HTMLElement))

            if (parentIsRoot && mindmap.children.length > 3) {
              const half = Math.trunc(mindmap.children.length / 2)
              children = [children[0].slice(0, half), children[0].slice(half)]
              childrenOffset = [childrenOffset[0].slice(0, half), childrenOffset[0].slice(half)]
            }

            childrenOffsetLeft = childrenOffset.map(each => Math.min(...each.map(offset => offset.left)))
            childrenOffsetRight = childrenOffset.map(each => Math.max(...each.map(offset => offset.right)))
            childrenOffsetVertical = childrenOffset.map(each =>
              each.map(offset => [offset.top, offset.bottom]).reduce((flatArr, cur) => flatArr.concat(cur), [] as number[]),
            )
          }
        }
      }) as EventListener,
    },
    {
      type: 'drag',
      listener: ((event: DragEvent) => {
        const ctx = dragCanvas!.getContext('2d')
        if (!ctx)
          return
        ctx.clearRect(0, 0, dragCanvas!.width, dragCanvas!.height)

        const total = children.length
        const moveX = -(containerWidth * drag.x / 100)
        const moveY = -(containerHeight * drag.y / 100)
        const mouseX = (event.x + containerLeft) / zoom + moveX
        const mouseY = (event.y + containerTop) / zoom + moveY

        for (let i = 0; i < total; i++) {
          if (!inDropArea && mouseX > childrenOffsetLeft[i] && mouseX < childrenOffsetRight[i]) {
            const childOffset = { left: childrenOffsetLeft[i], right: childrenOffsetRight[i], top: 0, bottom: 0 }
            const childLeftOfParent
              = i === 1
                || (!parentIsRoot
                  && (document.getElementById(nodeId) as HTMLElement | null)?.dataset.tag === LEFT_NODE)

            const lastIndex = childrenOffsetVertical[i].length - 1

            if (mouseY > childrenOffsetVertical[i][0] - 200 && mouseY < childrenOffsetVertical[i][0]) {
              childOffset.top = childrenOffsetVertical[i][0] - 50
              childOffset.bottom = childrenOffsetVertical[i][0]
              drawDragCanvas(ctx, theme, nodeId, parentOffset!, childOffset, childLeftOfParent)
              targetId = children[i][0]
              isSibling = true
              return
            }

            for (let j = 2; j < lastIndex + 1; j += 2) {
              if (mouseY > childrenOffsetVertical[i][j - 1] && mouseY < childrenOffsetVertical[i][j]) {
                childOffset.top = childrenOffsetVertical[i][j - 1]
                childOffset.bottom = childrenOffsetVertical[i][j]
                drawDragCanvas(ctx, theme, nodeId, parentOffset!, childOffset, childLeftOfParent)
                targetId = children[i][j / 2]
                isSibling = true
                return
              }
            }

            if (mouseY > childrenOffsetVertical[i][lastIndex] && mouseY < childrenOffsetVertical[i][lastIndex] + 200) {
              childOffset.top = childrenOffsetVertical[i][lastIndex]
              childOffset.bottom = childrenOffsetVertical[i][lastIndex] + 50
              drawDragCanvas(ctx, theme, nodeId, parentOffset!, childOffset, childLeftOfParent)
              targetId = children[i + 1]?.[0]
              isSibling = true
              return
            }
          }
        }
      }) as EventListener,
    },
    {
      type: 'dragover',
      listener: ((event: DragEvent) => {
        event.preventDefault()
      }) as EventListener,
    },
    {
      type: 'dragenter',
      listener: ((event: DragEvent) => {
        const target = event.target as HTMLElement | null
        if (target && target.dataset.tag === DROP_AREA) {
          target.parentElement?.classList.add('ondrag')
          targetId = target.parentElement?.id || ''
          isSibling = false
          inDropArea = true
        }
      }) as EventListener,
    },
    {
      type: 'dragleave',
      listener: ((event: DragEvent) => {
        const target = event.target as HTMLElement | null
        if (target && target.dataset.tag === DROP_AREA) {
          target.parentElement?.classList.remove('ondrag')
          targetId = ''
          isSibling = false
          inDropArea = false
        }
      }) as EventListener,
    },
    {
      type: 'drop',
      listener: ((event: DragEvent) => {
        const target = event.target as HTMLElement | null
        target?.parentElement?.classList.remove('ondrag')
        if (targetId !== '' && targetId !== nodeId && targetId !== parentId) {
          mindmapHook.moveNode(nodeId, targetId, parentId, isSibling)
        }
      }) as EventListener,
    },
    {
      type: 'dragend',
      listener: () => {
        const ctx = dragCanvas!.getContext('2d')
        if (ctx)
          ctx.clearRect(0, 0, dragCanvas!.width, dragCanvas!.height)
        container!.removeEventListener('scroll', handleContainerScroll)
      },
    },
  ]

  return events
}
