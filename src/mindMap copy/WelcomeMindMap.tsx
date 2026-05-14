'use client'
import type { MindMapNode } from '../mindMap/types'
import * as React from 'react'
import MindMapViewer from '../mindMap'

const ROOT_ID = 'rmind_root_node'

const DIFy_WELCOME_MINDMAP_DATA: MindMapNode = {
  id: ROOT_ID,
  text: 'Dify',
  showChildren: true,
  children: [
    {
      id: 'node-apps',
      text: '应用编排',
      showChildren: true,
      children: [
        { id: 'node-apps-1', text: 'Agent', showChildren: true, children: [] },
        { id: 'node-apps-2', text: '聊天助手', showChildren: true, children: [] },
        { id: 'node-apps-3', text: 'Agentic Workflow', showChildren: true, children: [] },
        { id: 'node-apps-4', text: 'Completions', showChildren: true, children: [] },
      ],
    },
    {
      id: 'node-datasets',
      text: '知识库',
      showChildren: true,
      children: [
        { id: 'node-datasets-1', text: 'RAG Pipeline', showChildren: true, children: [] },
        { id: 'node-datasets-2', text: '数据集管理', showChildren: true, children: [] },
        { id: 'node-datasets-3', text: '分段与索引', showChildren: true, children: [] },
      ],
    },
    {
      id: 'node-tools',
      text: '工具生态',
      showChildren: true,
      children: [
        { id: 'node-tools-1', text: '内置工具', showChildren: true, children: [] },
        { id: 'node-tools-2', text: '自定义工具', showChildren: true, children: [] },
        { id: 'node-tools-3', text: 'API 扩展', showChildren: true, children: [] },
      ],
    },
    {
      id: 'node-models',
      text: '模型接入',
      showChildren: true,
      children: [
        { id: 'node-models-1', text: 'LLM', showChildren: true, children: [] },
        { id: 'node-models-2', text: 'Embedding', showChildren: true, children: [] },
        { id: 'node-models-3', text: 'Rerank', showChildren: true, children: [] },
        { id: 'node-models-4', text: '语音合成', showChildren: true, children: [] },
      ],
    },
  ],
}

const WelcomeMindMap: React.FC = () => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-effects-highlight">
      <MindMapViewer
        initialData={JSON.stringify(DIFy_WELCOME_MINDMAP_DATA)}
        readonly={true}
        height={400}
        className="[&_.rmind-toolbar]:hidden"
      />
    </div>
  )
}

export default WelcomeMindMap
