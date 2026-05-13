
import React, { useEffect, useRef } from 'react';
import { css } from 'emotion';
import useMindmap from '../../../customHooks/useMindmap';
import useEditPanel from '../../../customHooks/useEditPanel';
import { handlePropagation } from '../../../methods/assistFunctions';


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
            <button className={menuIconBtn} onClick={handleDeleteNode} title="删除" disabled={layer < 1}>
                <i className="zwicon-delete" />
                <span>删除</span>
            </button>
        </div>
        <div className={divider} />
        <div className={actionRow}>
            <button className={actionBtn} onClick={handleAddInfo}>
                <i className="zwicon-sticker" />
                <span>添加备注</span>
            </button>
        </div>
    </div>);
};

export default Toolbar;

// CSS
const wrapper = css`
position: fixed;
z-index: 9999;
min-width: 180px;
background-color: #ffffff;
border-radius: 12px;
padding: 8px 0;
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
font-size: 13px;
`;

const iconRow = css`
display: flex;
justify-content: center;
gap: 2px;
padding: 4px 8px;
`;

const menuIconBtn = css`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
gap: 2px;
width: 52px;
padding: 6px 0;
background: transparent;
border: none;
border-radius: 8px;
cursor: pointer;
color: #333;
font-size: 11px;
transition: background 0.15s;

i {
font-size: 20px;
line-height: 1;
}

span {
white-space: nowrap;
}

&:hover {
background-color: #f0f0f0;
}

&:active {
background-color: #e0e0e0;
}

&:disabled {
opacity: 0.3;
cursor: not-allowed;
&:hover {
background-color: transparent;
}
}
`;

const divider = css`
height: 1px;
background-color: #e8e8e8;
margin: 4px 8px;
`;

const actionRow = css`
padding: 2px 8px;
`;

const actionBtn = css`
display: flex;
align-items: center;
gap: 8px;
width: 100%;
padding: 8px 12px;
background: transparent;
border: none;
border-radius: 8px;
cursor: pointer;
color: #333;
font-size: 13px;
transition: background 0.15s;

i {
font-size: 18px;
line-height: 1;
}

&:hover {
background-color: #f0f0f0;
}

&:active {
background-color: #e0e0e0;
}
`;
