const mousemoveInfo = {
  startX: 0,
  startY: 0,
  isDragging: false,
}

interface MoveHook {
  moveXY: (x: number, y: number) => void
}

interface ZoomHook {
  zoomIn: () => void
  zoomOut: () => void
}

// 判断是否点击到了思维导图节点或其子元素
function isNodeElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return !!(
    el.closest('[data-tag="nodeLeft"]') ||
    el.closest('[data-tag="nodeRight"]') ||
    el.closest('[data-tag="dropArea"]') ||
    el.closest('#rmind_root_node') ||
    el.closest('p') ||
    el.closest('button') ||
    el.closest('canvas')
  )
}

// Ctrl + 滚轮缩放
export function createWheelZoomHandler(zoomHook: ZoomHook) {
  const { zoomIn, zoomOut } = zoomHook
  return (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      e.stopPropagation()
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    }
  }
}

// 鼠标拖拽移动画布
export function createMouseDragHandler(moveHook: MoveHook) {
  const { moveXY } = moveHook
  return {
    handleMouseDown: (e: MouseEvent) => {
      if (e.button === 0 && !isNodeElement(e.target)) {
        mousemoveInfo.startX = e.clientX
        mousemoveInfo.startY = e.clientY
        mousemoveInfo.isDragging = false
      }
    },
    handleMouseMove: (e: MouseEvent) => {
      if (mousemoveInfo.startX === 0 && mousemoveInfo.startY === 0) return

      const movedX = e.clientX - mousemoveInfo.startX
      const movedY = e.clientY - mousemoveInfo.startY

      if (!mousemoveInfo.isDragging) {
        if (Math.abs(movedX) > 5 || Math.abs(movedY) > 5) {
          mousemoveInfo.isDragging = true
        } else {
          return
        }
      }

      const vwX = movedX / (window.innerWidth / 100)
      const vhY = movedY / (window.innerHeight / 100)
      moveXY(vwX, vhY)
      mousemoveInfo.startX = e.clientX
      mousemoveInfo.startY = e.clientY
    },
    handleMouseUp: () => {
      mousemoveInfo.startX = 0
      mousemoveInfo.startY = 0
      mousemoveInfo.isDragging = false
    },
  }
}
