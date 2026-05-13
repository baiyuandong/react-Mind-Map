import React from 'react';
import { css } from 'emotion';

const PreviewStatusBar = ({ selectedNode }) => {
    return (<div className={wrapper}>
        <span className={label}>已选择：</span>
        <span className={value}>{(selectedNode && selectedNode.text) || '无'}</span>
    </div>);
};

export default PreviewStatusBar;

const wrapper = css`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
    z-index: 1000;
`;

const label = css`
    font-size: 13px;
    color: #666;
`;

const value = css`
    font-size: 13px;
    color: #333;
    font-weight: 500;
`;
