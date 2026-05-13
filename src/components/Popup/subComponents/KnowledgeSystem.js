import React, { useState, useMemo } from 'react';
import { css } from 'emotion';
import { ButtonSet, MainButton, Highlight, Annotation } from '../common/styledComponents';

const DEFAULT_KNOWLEDGE_SYSTEMS = [
  { id: 'sys1', name: '知识体系A' },
  { id: 'sys2', name: '知识体系B' },
  { id: 'sys3', name: '知识体系C' },
];

const DEFAULT_MINDMAP_DATA = {
  id: 'rmind_root_node',
  text: '知识体系',
  children: [
    { id: 'n1', text: '数学', children: [
      { id: 'n1-1', text: '代数' },
      { id: 'n1-2', text: '几何' },
    ]},
    { id: 'n2', text: '物理', children: [
      { id: 'n2-1', text: '力学' },
      { id: 'n2-2', text: '电磁学' },
    ]},
    { id: 'n3', text: '化学', children: [
      { id: 'n3-1', text: '有机化学' },
      { id: 'n3-2', text: '无机化学' },
    ]},
  ],
};

const KnowledgeSystem = ({ handleClosePopup, onSelect }) => {
  const [selectedKnowledge, setSelectedKnowledge] = useState(DEFAULT_KNOWLEDGE_SYSTEMS[0]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [treeData, setTreeData] = useState(DEFAULT_MINDMAP_DATA);
  const [expandedIds, setExpandedIds] = useState(['rmind_root_node', 'n1', 'n2', 'n3']);
  const [zoom, setZoom] = useState(100);

  const getBreadcrumb = (nodeId, data = treeData, path = []) => {
    if (data.id === nodeId) return [...path, data.text];
    if (data.children) {
      for (const child of data.children) {
        const found = getBreadcrumb(nodeId, child, [...path, data.text]);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleNode = (nodeId) => {
    setSelectedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const removeNode = (nodeId) => {
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
  };

  const findNode = (data, id) => {
    if (data.id === id) return data;
    if (data.children) {
      for (const child of data.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (nodeId) => {
    setExpandedIds(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const filteredTree = useMemo(() => {
    if (!searchKeyword.trim()) return treeData;
    const keyword = searchKeyword.toLowerCase();

    const filterNode = (node) => {
      const matchSelf = node.text.toLowerCase().includes(keyword);
      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(child => child !== null);
      if (matchSelf || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return filterNode(treeData);
  }, [treeData, searchKeyword]);

  const handleKnowledgeChange = (e) => {
    const sys = DEFAULT_KNOWLEDGE_SYSTEMS.find(s => s.id === e.target.value);
    setSelectedKnowledge(sys);
    setSelectedNodes([]);
    const saved = localStorage.getItem(`mindmap_${sys.id}`);
    if (saved) {
      try {
        setTreeData(JSON.parse(saved));
      } catch {}
    } else {
      setTreeData(DEFAULT_MINDMAP_DATA);
    }
  };

  const handleConfirm = () => {
    const selectedData = selectedNodes.map(id => ({
      id,
      breadcrumb: getBreadcrumb(id),
      node: findNode(treeData, id),
    }));
    if (onSelect) {
      onSelect(selectedData, selectedKnowledge);
    }
    handleClosePopup();
  };

  const handleZoomChange = (delta) => {
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
  };

  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedIds.includes(node.id);
    const isSelected = selectedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = node.id === 'rmind_root_node';
    const isHighlighted = searchKeyword && node.text.toLowerCase().includes(searchKeyword.toLowerCase());

    return (
      <div key={node.id} style={{ paddingLeft: depth * 16 }}>
        <div className={treeNodeRow}>
          {hasChildren && (
            <span
              className={expandIcon}
              onClick={() => toggleExpand(node.id)}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && !isRoot && <span className={expandPlaceholder} />}
          {!isRoot && (
            <input
              type="checkbox"
              className={nodeCheckbox}
              checked={isSelected}
              onChange={() => toggleNode(node.id)}
            />
          )}
          <span
            className={nodeText}
            onClick={() => !isRoot && toggleNode(node.id)}
            style={{
              fontWeight: isRoot ? 'bold' : 'normal',
              color: isHighlighted ? '#ff6600' : 'inherit',
              backgroundColor: isHighlighted ? '#fff3e0' : 'transparent',
            }}
          >
            {node.text}
          </span>
          {isSelected && !isRoot && (
            <span
              className={removeIcon}
              onClick={() => removeNode(node.id)}
            >
              ×
            </span>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={wrapper}>
      <div className={header}>
        <h3 className={title}>选择知识体系</h3>
      </div>

      <div className={body}>
        {/* Left Panel */}
        <div className={leftPanel}>
          <div className={panelSection}>
            <label className={fieldLabel}>选择知识体系</label>
            <select
              className={select}
              value={selectedKnowledge.id}
              onChange={handleKnowledgeChange}
            >
              {DEFAULT_KNOWLEDGE_SYSTEMS.map(sys => (
                <option key={sys.id} value={sys.id}>{sys.name}</option>
              ))}
            </select>
          </div>

          <div className={panelSection}>
            <label className={fieldLabel}>
              已选节点
              <span className={countBadge}>{selectedNodes.length}</span>
            </label>
            <div className={selectedList}>
              {selectedNodes.length === 0 && (
                <div className={emptyHint}>暂无选中的节点</div>
              )}
              {selectedNodes.map(nodeId => {
                const breadcrumb = getBreadcrumb(nodeId);
                const node = findNode(treeData, nodeId);
                return (
                  <div key={nodeId} className={selectedItem}>
                    <span className={selectedText}>
                      {breadcrumb ? breadcrumb.join(' > ') : (node ? node.text : '')}
                    </span>
                    <span
                      className={selectedRemove}
                      onClick={() => removeNode(nodeId)}
                    >
                      ×
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Panel - Mindmap Tree */}
        <div className={middlePanel}>
          <div className={treeWrapper} style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            {renderTreeNode(filteredTree)}
          </div>
          <div className={treeFooter}>
            <span className={legendItem}>
              <span className={legendDot} style={{ backgroundColor: '#ff6600' }} />
              高亮匹配搜索关键词
            </span>
            <div className={zoomControls}>
              <button className={zoomBtn} onClick={() => handleZoomChange(-10)}>－</button>
              <span className={zoomText}>{zoom}%</span>
              <button className={zoomBtn} onClick={() => handleZoomChange(10)}>＋</button>
            </div>
          </div>
        </div>

        {/* Right Panel - Search */}
        <div className={rightPanel}>
          <div className={panelSection}>
            <label className={fieldLabel}>搜索节点</label>
            <input
              type="text"
              className={searchInput}
              placeholder="输入关键词搜索..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <div className={searchResult}>
                共找到 {countMatches(filteredTree, searchKeyword.toLowerCase())} 个匹配节点
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={footer}>
        <button className={cancelBtn} onClick={handleClosePopup}>取消</button>
        <button className={confirmBtn} onClick={handleConfirm} disabled={selectedNodes.length === 0}>
          确定 ({selectedNodes.length})
        </button>
      </div>
    </div>
  );
};

const countMatches = (node, keyword) => {
  let count = 0;
  if (node.text.toLowerCase().includes(keyword)) count++;
  if (node.children) {
    node.children.forEach(child => {
      count += countMatches(child, keyword);
    });
  }
  return count;
};

export default KnowledgeSystem;

// CSS
const wrapper = css`
  display: flex;
  flex-direction: column;
  max-height: 70vh;
`;

const header = css`
  margin-bottom: 16px;
`;

const title = css`
  margin: 0;
  font-size: 18px;
  color: #333;
`;

const body = css`
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
`;

const leftPanel = css`
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-right: 1px solid #eee;
  padding-right: 16px;
`;

const middlePanel = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #eee;
  padding-right: 16px;
`;

const rightPanel = css`
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`;

const panelSection = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const fieldLabel = css`
  font-size: 13px;
  color: #666;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const countBadge = css`
  display: inline-block;
  background: #ff6600;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: normal;
`;

const select = css`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #ff6600;
  }
`;

const selectedList = css`
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const emptyHint = css`
  color: #aaa;
  font-size: 12px;
  padding: 8px 0;
  text-align: center;
`;

const selectedItem = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #fff7f0;
  border-radius: 4px;
  font-size: 12px;
  gap: 4px;
`;

const selectedText = css`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
`;

const selectedRemove = css`
  color: #ff6600;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;

  &:hover {
    color: #cc5200;
  }
`;

const treeWrapper = css`
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 8px 4px;
  font-size: 14px;
  line-height: 1.8;
`;

const treeNodeRow = css`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;

  &:hover {
    background: #f5f5f5;
  }
`;

const expandIcon = css`
  cursor: pointer;
  font-size: 10px;
  color: #888;
  width: 14px;
  flex-shrink: 0;
  user-select: none;
`;

const expandPlaceholder = css`
  width: 14px;
  flex-shrink: 0;
`;

const nodeCheckbox = css`
  cursor: pointer;
  flex-shrink: 0;
`;

const nodeText = css`
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  flex: 1;
`;

const removeIcon = css`
  cursor: pointer;
  color: #ff6600;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;

  &:hover {
    color: #cc5200;
  }
`;

const treeFooter = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 4px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const legendItem = css`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
`;

const legendDot = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

const zoomControls = css`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const zoomBtn = css`
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
  }
`;

const zoomText = css`
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
`;

const searchInput = css`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #ff6600;
  }
`;

const searchResult = css`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const footer = css`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #eee;
`;

const cancelBtn = css`
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }
`;

const confirmBtn = css`
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #ff6600;
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #e65c00;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
