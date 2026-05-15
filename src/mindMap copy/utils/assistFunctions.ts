import { MindMapNode } from "../types"

export function deepCopy<T>(input: T): T {
  if (input instanceof Object) {
    if (Array.isArray(input)) {
      return input.map(deepCopy) as unknown as T
    }
    const output: Record<string, unknown> = {}
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      output[key] = deepCopy(value)
    })
    return output as T
  }
  return input
}

export function findNode(node: MindMapNode, searchId: string): MindMapNode | undefined {
  if (node.id === searchId) return node
  if (!node.children) return undefined
  for (const child of node.children) {
    const found = findNode(child, searchId)
    if (found) return found
  }
  return undefined
}

export function setShowChildrenTrue(node: MindMapNode): void {
  node.showChildren = true
  if (node.children) node.children.forEach(setShowChildrenTrue)
}

export function handlePropagation(e: React.UIEvent | Event): void {
  e.stopPropagation()
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
