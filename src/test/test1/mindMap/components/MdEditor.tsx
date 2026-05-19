import React, { useState, useEffect } from 'react'
import useMindMapStore from '../store'

interface MdEditorProps {
  className?: string
}

const MdEditor: React.FC<MdEditorProps> = ({ className }) => {
  const curNodeInfo = useMindMapStore((s) => s.curNodeInfo)
  const editNodeInfo = useMindMapStore((s) => s.editNodeInfo)
  const [text, setText] = useState('')

  useEffect(() => {
    setText(curNodeInfo.describe || '')
  }, [curNodeInfo.describe, curNodeInfo.id])

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  const onBlur = () => {
    if (curNodeInfo.id) {
      editNodeInfo(curNodeInfo.id, text)
    }
  }

  return (
    <div className={className}>
      <textarea
        onChange={onChange}
        onBlur={onBlur}
        value={text}
        placeholder="输入备注内容..."
        style={{ width: '100%', height: '100%', resize: 'none', border: '1px solid #ddd', borderRadius: 4, padding: 8 }}
      />
    </div>
  )
}

export default MdEditor
