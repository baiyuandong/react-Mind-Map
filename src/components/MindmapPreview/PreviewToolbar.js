import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { css } from 'emotion';
import useMindmap from '../../../customHooks/useMindmap';
import useEditPanel from '../../../customHooks/useEditPanel';
import { handlePropagation } from '../../../methods/assistFunctions';

const PreviewToolbar = ({ node, x, y, onClose }) => {
    const menuRef = useRef();
    const mindmapHook = useMindmap();
    const editPanelHook = useEditPanel();

    const handleViewInfo = () => {
        mindmapHook.selectNode(node.id);
        editPanelHook.toggelPanelShow(true);
        onClose && onClose();
    };

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
                <button className={menuItem} onClick={handleViewInfo}>
                    <i className="zwicon-sticker" />
                    <span>查看备注</span>
                </button>
            </div>
        </div>, document.body
    );
};

export default PreviewToolbar;

const wrapper = css`
    position: fixed;
    z-index: 9999;
    min-width: 140px;
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
        white-space: nowrap;
    }

    &:hover {
        background-color: #f7f7f8;
    }

    &:active {
        background-color: #efefef;
    }
`;
