import React, { useContext } from 'react';
import { css } from 'emotion';
import { context } from '../../context';
import * as refer from '../../statics/refer';

const PreviewNav = ({ onClose, selectedNode }) => {
    const { mindmap: { state: root_node } } = useContext(context);

    return (<nav className={wrapper}>
        <section className={left_section}>
            <span className={title}>思维导图预览</span>
        </section>
        <section className={right_section}>
            <button className={closeBtn} onClick={onClose}>
                <i className="zwicon-close" />
            </button>
        </section>
    </nav>);
};

export default PreviewNav;

const wrapper = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    padding: 0 16px;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
`;

const left_section = css`
    display: flex;
    align-items: center;
`;

const title = css`
    font-size: 16px;
    font-weight: 500;
    color: #333;
`;

const right_section = css`
    display: flex;
    align-items: center;
`;

const closeBtn = css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    font-size: 20px;
    color: #666;

    &:hover {
        background-color: #f5f5f5;
        color: #333;
    }

    &:active {
        transform: scale(0.95);
    }
`;
