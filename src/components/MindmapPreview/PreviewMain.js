import React, { useRef, useState, useCallback } from 'react';
import { css } from 'emotion';
import PreviewMindmap from './PreviewMindmap';
import * as refer from '../../statics/refer';

const wrapper = css`
    height: calc(100vh - 48px - 40px);
    margin: 48px 0 40px;
    overflow: hidden;
`;

const dragHint = css`
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    z-index: 100;
    pointer-events: none;
    opacity: 0.7;
    user-select: none;
`;

const PreviewMain = ({ container_ref, onNodeSelect }) => {
    const self = useRef();
    const [selectedNode, setSelectedNode] = useState(null);

    const handleNodeSelect = useCallback((node) => {
        setSelectedNode(node);
        if (onNodeSelect) {
            onNodeSelect(node);
        }
    }, [onNodeSelect]);

    return (
        <main ref={self} className={wrapper} id={refer.MINDMAP_MAIN}>
            <div className={dragHint}>在空白区域拖拽移动画布 · Ctrl+滚轮缩放</div>
            <PreviewMindmap container_ref={self} onNodeSelect={handleNodeSelect} />
        </main>
    );
};

export default PreviewMain;
