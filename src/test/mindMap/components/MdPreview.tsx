import React, { useEffect, useRef } from 'react'
import useMindMapStore from '../store'

interface MdPreviewProps {
  mdtext?: string
}

const MdPreview: React.FC<MdPreviewProps> = ({ mdtext = '' }) => {
  return (
    <span style={{ fontSize: 20, marginLeft: 4 }}>
      📝
      <span style={{ fontSize: 12, color: '#666', marginLeft: 4, display: 'none' }}>
        {mdtext ? '有备注' : ''}
      </span>
    </span>
  )
}

export default MdPreview
