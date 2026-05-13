import React, { useState, useRef, useCallback } from 'react';
import { css } from 'emotion';
import PreviewNav from './PreviewNav';
import PreviewMain from './PreviewMain';
import PreviewStatusBar from './PreviewStatusBar';

const MindmapPreview = ({ onClose, onNodeSelect }) => {
    const container_ref = useRef();
    const [selectedNode, setSelectedNode] = useState(null);

    const handleNodeSelect = useCallback((node) => {
        setSelectedNode(node);
        if (onNodeSelect) {
            onNodeSelect(node);
        }
    }, [onNodeSelect]);

    return (
        <div className={overlay} onClick={onClose}>
            <div className={modal} onClick={e => e.stopPropagation()}>
                <PreviewNav onClose={onClose} />
                <PreviewMain container_ref={container_ref} onNodeSelect={handleNodeSelect} />
                <PreviewStatusBar selectedNode={selectedNode} />
            </div>
        </div>
    );
};

export default MindmapPreview;

const overlay = css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
`;

const modal = css`
    position: relative;
    width: 90vw;
    height: 85vh;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
`;
