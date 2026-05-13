import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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

    return ReactDOM.createPortal(
        <div
            className={wrapper}
            ref={menuRef}
            style={{ left: x, top: y }}
            onClick={handlePropagation}
        >
            <div className={list}>
                <button className={menuItem} onClick={handleAddChild} title="添加子节点">
                    <i className="zwicon-git-commit" />
                    <span>新增子级分类</span>
                    <span>tab</span>
                </button>

                <button className={menuItem} onClick={handleAddSibling} title="添加兄弟节点" disabled={layer < 1}>
                    <i className="zwicon-git-fork" />
                    <span>新增同级分类</span>
                </button>

                <button className={menuItem} onClick={handleToggleChildren} title="显隐子节点" disabled={layer < 1 || node.children.length === 0}>
                    <i className="zwicon-split-v" />
                    <span>{node.showChildren ? '收起子级' : '展开/折叠子级'}</span>
                </button>

                <div className={divider} />

                <button className={menuItem} onClick={handleEditNode} title="重命名">
                    <i className="zwicon-edit-pencil" />
                    <span>重命名</span>
                    <span>双击</span>
                </button>

                <button className={menuItem} onClick={handleAddInfo}>
                    <i className="zwicon-sticker" />
                    <span>备注</span>
                </button>

                <div className={divider} />

                <button className={menuItem} onClick={handleDeleteNode} title="删除" disabled={layer < 1}>
                    <i className="zwicon-delete" />
                    <span>删除</span>
                </button>
            </div>
        </div>, document.body
    );
};

export default Toolbar;

// CSS
const wrapper = css`
position: fixed;
z-index: 9999;
min-width: 200px;
background-color: #ffffff;
border-radius: 8px;
padding: 6px 6px;
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
font-size: 13px;
`;

const list = css`
display: flex;
flex-direction: column;
`;

const menuItem = css`
display: flex;
align-items: center;
gap: 10px;
width: 100%;
padding: 8px 10px;
background: transparent;
border: none;
border-radius: 6px;
cursor: pointer;
color: #333;
text-align: left;
font-size: 14px;
transition: background 0.12s;

i {
    font-size: 18px;
    line-height: 1;
    width: 20px;
    text-align: center;
}

span {
    flex: 1;
}

&:hover {
    background-color: #f7f7f8;
}

&:active {
    background-color: #efefef;
}

&:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    &:hover {
        background-color: transparent;
    }
}
`;

const divider = css`
height: 1px;
background-color: #f0f0f0;
margin: 6px 0;
`;
