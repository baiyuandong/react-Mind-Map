import React, { useState, useRef, useCallback, useContext } from 'react';
import { css } from 'emotion';
import { context } from '../../context';
import useMindmap from '../../customHooks/useMindmap';
import { handlePropagation } from '../../methods/assistFunctions';

/**
 * 递归搜索节点，返回匹配的节点以及从根到该节点的路径（祖先链）
 * 返回格式：{ node, path: [ancestor, ..., node] }
 */
const searchNodesWithPath = (node, keyword, parentPath = []) => {
    if (!node || !keyword.trim()) return [];
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    const currentPath = [...parentPath, node];

    if (node.text && node.text.toLowerCase().includes(lowerKeyword)) {
        results.push({ node, path: currentPath });
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            results.push(...searchNodesWithPath(child, keyword, currentPath));
        });
    }
    return results;
};

/**
 * 判断是否有同名节点
 */
const hasSameNameNodes = (allResults) => {
    if (allResults.length <= 1) return false;
    const textCount = {};
    allResults.forEach(r => {
        textCount[r.node.text] = (textCount[r.node.text] || 0) + 1;
    });
    return Object.values(textCount).some(c => c > 1);
};

const SearchBox = () => {
    const { mindmap: { state: rootNode } } = useContext(context);
    const mindmapHook = useMindmap();
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]); // 存 { node, path }
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef();
    const resultsRef = useRef();

    const handleInputChange = useCallback((e) => {
        const val = e.target.value;
        setKeyword(val);
        if (val.trim()) {
            const found = searchNodesWithPath(rootNode, val);
            setResults(found);
            setShowResults(true);
            setActiveIndex(-1);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [rootNode]);

    const handleFocus = useCallback(() => {
        if (keyword.trim() && results.length > 0) {
            setShowResults(true);
        }
    }, [keyword, results]);

    const handleSelect = useCallback((item) => {
        // 展开所有祖先节点（确保目标节点可见）
        const { node, path } = item;
        path.forEach(p => {
            if (!p.showChildren) {
                mindmapHook.toggleChildren(p.id, true);
            }
        });
        // 选中目标节点（触发 scrollIntoView 居中）
        mindmapHook.selectNode(node.id);
        // 关闭下拉、清空搜索
        setShowResults(false);
        setKeyword('');
        setResults([]);
        if (inputRef.current) inputRef.current.blur();
    }, [mindmapHook]);

    const handleKeyDown = useCallback((e) => {
        if (!showResults || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < results.length) {
                handleSelect(results[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowResults(false);

            if (inputRef.current) inputRef.current.blur();
        }
    }, [showResults, results, activeIndex, handleSelect]);

    const handleClear = useCallback(() => {
        setKeyword('');
        setResults([]);
        setShowResults(false);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
        <div className={wrapper} onClick={handlePropagation}>
            <i className={`zwicon-search ${searchIcon}`} />
            <input
                ref={inputRef}
                className={input}
                type="text"
                placeholder="搜索节点…"
                value={keyword}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
            />
            {keyword && (
                <button className={clearBtn} onClick={() => { setKeyword(''); setResults([]); setShowResults(false); inputRef.current.focus(); }}>
                    <i className="zwicon-close" />
                </button>
            )}
            {showResults && results.length > 0 && (
                <div className={dropdown} ref={resultsRef}>
                    <div className={resultCount}>找到 {results.length} 个节点</div>
                    {results.map((node, index) => (
                        <div
                            key={node.id}
                            className={`${resultItem} ${index === activeIndex ? resultItemActive : ''}`}
                            onClick={() => handleSelect(node)}
                            onMouseEnter={() => setActiveIndex(index)}
                        >
                            {/* 用缩进和图标表示节点层级 */}
                            <span className={nodeText}>{node.text || '(无文本)'}</span>
                        </div>
                    ))}
                </div>
            )}
            {showResults && keyword.trim() && results.length === 0 && (
                <div className={dropdown}>
                    <div className={noResult}>未找到匹配节点</div>
                </div>
            )}
        </div>
    );
};

export default SearchBox;

// CSS
const wrapper = css`
position: relative;
display: flex;
align-items: center;
width: 260px;
height: 34px;
background: #f5f5f5;
border-radius: 8px;
padding: 0 10px;
transition: background 0.2s, box-shadow 0.2s;

&:focus-within {
background: #ffffff;
box-shadow: 0 0 0 2px #e0e0e0;
}
`;

const searchIcon = css`
font-size: 16px;
color: #999;
margin-right: 6px;
flex-shrink: 0;
`;

const input = css`
flex: 1;
height: 100%;
border: none;
outline: none;
background: transparent;
font-size: 14px;
color: #333;

&::placeholder {
color: #bbb;
}
`;

const clearBtn = css`
display: flex;
align-items: center;
justify-content: center;
width: 20px;
height: 20px;
border: none;
background: transparent;
cursor: pointer;
color: #999;
font-size: 14px;
border-radius: 50%;
flex-shrink: 0;
padding: 0;

&:hover {
background: #e0e0e0;
color: #666;
}
`;

const dropdown = css`
position: absolute;
top: calc(100% + 6px);
left: 0;
right: 0;
background: #ffffff;
border-radius: 10px;
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08);
max-height: 320px;
overflow-y: auto;
z-index: 9999;
padding: 6px 0;
`;

const resultCount = css`
padding: 6px 14px 4px;
font-size: 12px;
color: #999;
border-bottom: 1px solid #f0f0f0;
margin-bottom: 4px;
`;

const resultItem = css`
display: flex;
align-items: center;
gap: 8px;
padding: 8px 14px;
cursor: pointer;
font-size: 14px;
color: #333;
transition: background 0.1s;

&:hover {
background: #f5f5f5;
}
`;

const resultItemActive = css`
background: #e8f0fe !important;
color: #1a73e8;
`;

const nodeText = css`
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
flex: 1;
`;

const noResult = css`
padding: 16px 14px;
text-align: center;
font-size: 13px;
color: #999;
`;
