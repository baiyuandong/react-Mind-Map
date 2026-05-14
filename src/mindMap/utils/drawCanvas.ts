import { Theme, MindMapNode } from '../types'
import { LEFT_NODE, RIGHT_NODE } from '../types'

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * 绘制贝塞尔曲线
 */
function drawBezier(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  ctx.moveTo(fromX, fromY)
  ctx.bezierCurveTo(fromX, toY, 0.9 * toX + 0.1 * fromX, toY, toX, toY)
}

/**
 * 递归绘制线条
 */
function drawLine(ctx: CanvasRenderingContext2D, node: MindMapNode, map: Map<string, [number, number, number, string]>) {
  const { id: parentId, children } = node
  if (children && children.length > 0) {
    const parentData = map.get(parentId)
    if (!parentData) return
    const [parentXLeft, parentXRight, parentY] = parentData

    children.forEach((child) => {
      const childData = map.get(child.id)
      if (childData) {
        const [childXLeft, childXRight, childY, childTag] = childData
        if (childTag === LEFT_NODE) {
          drawBezier(ctx, parentXLeft, parentY, childXRight, childY)
        } else {
          drawBezier(ctx, parentXRight, parentY, childXLeft, childY)
        }
        drawLine(ctx, child, map)
      }
    })
  }
}

/**
 * 在 LineCanvas 上绘制所有连线
 */
export function drawLineCanvas(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  mindmap: MindMapNode,
  map: Map<string, [number, number, number, string]>,
) {
  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.strokeStyle = theme.main
  drawLine(ctx, mindmap, map)
  ctx.stroke()
  ctx.closePath()
}

/**
 * 在 DragCanvas 上绘制拖拽提示
 */
export function drawDragCanvas(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  childId: string,
  parentOffset: Rect,
  childOffset: Rect,
  childLeftOfParent: boolean,
) {
  const virtualRectWidth = 50
  const virtualRectHeight = 20
  ctx.beginPath()
  ctx.strokeStyle = theme.main
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])

  const parentY = (parentOffset.top + parentOffset.bottom) / 2
  const childY = (childOffset.top + childOffset.bottom) / 2

  let parentX: number, childX: number
  if (childLeftOfParent) {
    parentX = parentOffset.left
    childX = childOffset.right
    ctx.strokeRect(childX - virtualRectWidth, childY - virtualRectHeight / 2, virtualRectWidth, virtualRectHeight)
  } else {
    parentX = parentOffset.right
    childX = childOffset.left
    ctx.strokeRect(childX, childY - virtualRectHeight / 2, virtualRectWidth, virtualRectHeight)
  }
  drawBezier(ctx, parentX, parentY, childX, childY)
  ctx.stroke()
  ctx.closePath()
}
