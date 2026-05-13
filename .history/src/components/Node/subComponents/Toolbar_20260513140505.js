

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { css } from 'emotion';
import useMindmap from '../../../customHooks/useMindmap';
import useEditPanel from '../../../customHooks/useEditPanel';

import { handlePropagation } from '../../../methods/assistFunctions';
import ToolButton from '../../ToolButton';


const Toolbar = ({ layer, node, parent, x, y, onClose }) => {
    const mindmapHook = useMindmap();

    const editPanelHook = useEditPanel();
    const menuRef = useRef();

    const handleAddChild = () => {
        mindmapHook.addChild(node.id);
        onClose && onClose();
    };

    const handleAddSibling = () => {
        mindmapHook.addSibling(node.id, parent.id);
        onClose && onClose();
    };

    const handleDeleteNode = () => {
        mindmapHook.deleteNode(node.id, parent.id);
        onClose && onClose();
    };

    const handleEditNode = () => {
        mindmapHook.editNode(node.id);
        onClose && onClose();
    };

    const handleToggleChildren = () => {
        mindmapHook.toggleChildren(node.id, !node.showChildren);
        onClose && onClose();
    };


    const handleAddInfo = () => {
        mindmapHook.selectNode(node.id);
        editPanelHook.toggelPanelShow(true);

        onClose && onClose();
    };

    // 点击菜单外部关闭
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose && onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (<div
        className={wrapper}
        ref={menuRef}
        style={{ left: x, top: y }}
        onClick={handlePropagation}>
        <div className={iconRow}>
            <button className={menuIconBtn} onClick={handleEditNode} title="编辑">
                <i className="zwicon-edit-pencil" />
                <span>编辑</span>
            </button>
            <button className={menuIconBtn} onClick={handleAddChild} title="添加子节点">
                <i className="zwicon-git-commit" />
                <span>子节点</span>
            </button>
            <button className={menuIconBtn} onClick={handleAddSibling} title="添加兄弟节点" disabled={layer < 1}>
                <i className="zwicon-git-fork" />
                <span>兄弟节点</span>
            </button>
            <button className={menuIconBtn} onClick={handleToggleChildren} title="显隐子节点" disabled={layer < 1 || node.children.length === 0}>
                <i className="zwicon-split-v" />
                <span>折叠</span>
            </button>
    </div>);
};

export default Toolbar;

// CSS
const wrapper = css`
display: flex;
position: absolute;
bottom: calc(100% + 5px);
left:0;
background-color: #ffffff;
width: max-content;
height: 50px;
padding: 0 8px;
font-size: 20px;
background-color: #ffffff;
border-radius: 10px;
box-shadow: 5px 5px 10px #aaaaaa;
`;