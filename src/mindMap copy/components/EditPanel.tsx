import * as React from 'react'
import { useContext, useEffect } from 'react'
import useMindMapStore from '../store'
import MdEditor from './MdEditor'

const EditPanel: React.FC = () => {
  const editPanelShow = useMindMapStore(s => s.editPanelShow)
  const curNodeInfo = useMindMapStore(s => s.curNodeInfo)
  const toggleEditPanel = useMindMapStore(s => s.toggleEditPanel)

  if (!editPanelShow)
    return null

  return (
    <div
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      style={{
        height: 500,
        width: 300,
        top: 76,
        right: 40,
        overflow: 'auto',
        position: 'fixed',
        border: '2px solid #eee',
        borderRadius: 10,
        background: '#fff',
        boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.16)',
        padding: '20px 10px',
        zIndex: 100,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        当前编辑节点：
        {curNodeInfo.text || '无'}
      </div>
      <button
        onClick={() => toggleEditPanel(false)}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          cursor: 'pointer',
          fontSize: 20,
          background: 'none',
          border: 'none',
        }}
      >
        ✕
      </button>
      <div style={{ marginTop: 20, width: 295, height: 460 }}>
        <MdEditor />
      </div>
    </div>
  )
}

export default EditPanel
