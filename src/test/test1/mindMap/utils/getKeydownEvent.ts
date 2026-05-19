import { NodeStatus } from '../types'

interface MindmapHook {
  addChild: (nodeId: string) => void
  addSibling: (nodeId: string, parentId: string) => void
  editNode: (nodeId: string) => void
  deleteNode: (nodeId: string, parentId: string) => void
  toggleChildren: (nodeId: string, bool: boolean) => void
  selectNode: (nodeId: string, selectByClick?: boolean) => void
}

interface HistoryHook {
  undoHistory: () => void
  redoHistory: () => void
}

const ROOT_PARENT_ID = 'rmind_root_node'

export default function getKeydownEvent(
  nodeStatus: NodeStatus,
  mindmapHook: MindmapHook,
  historyHook: HistoryHook,
): (event: KeyboardEvent) => void {
  const { addChild, addSibling, editNode, deleteNode, toggleChildren, selectNode } = mindmapHook

  const handleKeyEventWithNode = (event: KeyboardEvent) => {
    const info = nodeStatus.cur_node_info

    switch (event.key.toUpperCase()) {
      case 'TAB':
        addChild(nodeStatus.cur_select)
        break
      case 'ENTER':
        event.preventDefault()
        addSibling(nodeStatus.cur_select, info.parent?.id || '')
        break
      case 'F2':
        editNode(nodeStatus.cur_select)
        break
      case 'BACKSPACE':
      case 'DELETE':
        deleteNode(nodeStatus.cur_select, info.parent?.id || '')
        break
      case ' ':
        event.preventDefault()
        toggleChildren(nodeStatus.cur_select, !info.showChildren)
        break
      case 'ARROWLEFT':
        event.preventDefault()
        if (info.parent?.id === ROOT_PARENT_ID) {
          if (info.children.length > 3) {
            selectNode(info.children[Math.trunc(info.children.length / 2)].id)
          }
        } else {
          if (!info.on_left) {
            selectNode(info.parent?.id || '')
          } else if (info.children.length > 0) {
            selectNode(info.children[0].id)
          }
        }
        break
      case 'ARROWRIGHT':
        event.preventDefault()
        if (info.on_left) {
          selectNode(info.parent?.id || '')
        } else if (info.children.length > 0) {
          selectNode(info.children[0].id)
        }
        break
      case 'ARROWUP': {
        event.preventDefault()
        const curIndex = info.parent?.children?.findIndex((child) => child.id === nodeStatus.cur_select) ?? -1
        if (curIndex > 0) {
          selectNode(info.parent.children[curIndex - 1].id)
        }
        break
      }
      case 'ARROWDOWN': {
        event.preventDefault()
        const curIndex = info.parent?.children?.findIndex((child) => child.id === nodeStatus.cur_select) ?? -1
        const lastIndex = (info.parent?.children?.length ?? 0) - 1
        if (curIndex < lastIndex) {
          selectNode(info.parent.children[curIndex + 1].id)
        }
        break
      }
      default:
        break
    }
  }

  return (event: KeyboardEvent) => {
    // 如果焦点在输入框、文本框或可编辑元素中，忽略快捷键处理
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase()
    const isEditable =
      tag === 'input' ||
      tag === 'textarea' ||
      (event.target as HTMLElement)?.isContentEditable === true
    if (isEditable)
      return

    if (nodeStatus.cur_edit === '') {
      const isOnMac = navigator.platform.toUpperCase().startsWith('MAC')
      const combineKeyPressed = isOnMac ? event.metaKey : event.ctrlKey
      if (combineKeyPressed && event.key.toUpperCase() === 'Z') {
        if (event.shiftKey) {
          historyHook.redoHistory()
        } else {
          historyHook.undoHistory()
        }
      }
    }
    if (nodeStatus.cur_select !== '') {
      try {
        handleKeyEventWithNode(event)
      } catch {
        alert('当前的节点信息存在问题，请重新选择节点')
      }
    }
  }
}

