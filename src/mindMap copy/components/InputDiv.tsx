import * as React from 'react'
import { useEffect, useRef } from 'react'
import useMindMapStore from '../store'

type InputDivProps = {
  nodeId: string
  children: React.ReactNode
}

const InputDiv: React.FC<InputDivProps> = ({ nodeId, children }) => {
  const selfRef = useRef<HTMLDivElement>(null)
  const changeText = useMindMapStore(s => s.changeText)
  const selectNode = useMindMapStore(s => s.selectNode)

  const handleKeydown = (event: React.KeyboardEvent) => {
    switch (event.key.toUpperCase()) {
      case 'ESCAPE':
        if (selfRef.current) {
          selfRef.current.textContent = String(children)
        }
      // fallthrough
      case 'ENTER':
        selfRef.current?.blur()
        break
      default:
        break
    }
  }

  const handleBlur = () => {
    if (selfRef.current) {
      changeText(nodeId, selfRef.current.textContent || '')
      selectNode(nodeId)
    }
  }

  useEffect(() => {
    if (selfRef.current) {
      selfRef.current.focus()
      const selection = window.getSelection()
      if (selection) {
        selection.selectAllChildren(selfRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={selfRef}
      contentEditable
      suppressContentEditableWarning
      onClick={e => e.stopPropagation()}
      onKeyDown={handleKeydown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 'fit-content',
        minWidth: '1em',
        maxWidth: '10em',
        height: 'fit-content',
        margin: 'auto',
        padding: 10,
        color: '#333333',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 20px #aaaaaa',
        borderRadius: 5,
        outline: 'none',
        zIndex: 3,
        userSelect: 'text',
      }}
    >
      {children}
    </div>
  )
}

export default InputDiv
