import React, { useRef } from 'react';
import { css } from 'emotion';
import Mindmap from '../Mindmap';
import EditPanel from '../EditPanel';
import * as refer from '../../statics/refer';

const Main = () => {
    const self = useRef();

    return (<main ref={self} className={wrapper} id={refer.MINDMAP_MAIN}>
        <div className={dragHint}>在空白区域拖拽移动画布 · Ctrl+滚轮缩放</div>
        <Mindmap container_ref={self} />
        <EditPanel />
    </main>);
};

export default Main;

// CSS
const wrapper = css`
height: calc(100vh - 56px);
margin: 56px 0 0;
overflow: hidden;




`;

const dragHint = css`
position: fixed;
bottom: 20px;
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

