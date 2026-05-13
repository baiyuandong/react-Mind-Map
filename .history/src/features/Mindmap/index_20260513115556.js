import React, { useEffect, useContext, useRef, useMemo, useState } from 'react';
import { css } from 'emotion';
import * as refer from '../../statics/refer';
import { context } from '../../context/';
import { setHistory } from '../../context/reducer/history/actionCreator';
import useMindmap from '../../customHooks/useMindmap';
import useHistory from '../../customHooks/useHistory';
import getKeydownEvent from '../../methods/getKeydownEvent';
import { createWheelZoomHandler, createMouseDragHandler } from '../../methods/getMouseWheelEvent';
import RootNode from '../../components/RootNode';
import DragCanvas from '../../components/DragCanvas';
import LineCanvas from '../../components/LineCanvas';
import useZoom from '../../customHooks/useZoom';
import useMove from '../../customHooks/useMove';
import { debounce } from '../../methods/assistFunctions';

const node_refs = new Set();

const Mindmap = ({ container_ref }) => {
    const self = useRef();
    const { mindmap: { state: root_node }, nodeStatus: { state: nodeStatus }, history: { dispatch: hDispatch }, global: { state: gState } } = useContext(context);

    const historyHook = useHistory();
    const mindmapHook = useMindmap();
    const zoomHook = useZoom();
    const moveHook = useMove()
    const { clearNodeStatus } = mindmapHook;
    const [FLAG, setFLAG] = useState(0)

    const mindmap_json = useMemo(() => JSON.stringify(root_node), [root_node]);

    const handleResize = () => {
        setFLAG(Date.now())
    }

    useEffect(() => {
        const handleKeydown = getKeydownEvent(nodeStatus, mindmapHook, historyHook);
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        }
    }, [historyHook, mindmapHook, nodeStatus]);

    useEffect(() => {
        window.addEventListener('click', clearNodeStatus);
        return () => {
            window.removeEventListener('click', clearNodeStatus);
        }
    }, [clearNodeStatus]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [])

    // 全新事件绑定：分离滚轮缩放和鼠标拖拽
    useEffect(() => {
        const mainEl = document.querySelector(`#${refer.MINDMAP_MAIN}`);
        if (!mainEl) return;

        const normalizeXY = container_ref.current.clientWidth / container_ref.current.clientHeight;

        // Ctrl + 滚轮缩放
        const wheelZoomHandler = createWheelZoomHandler(zoomHook);
        mainEl.addEventListener('wheel', wheelZoomHandler, { passive: false });

        // 鼠标拖拽移动画布

        const dragHandler = createMouseDragHandler(moveHook);
        mainEl.addEventListener('mousedown', dragHandler.handleMouseDown);
        mainEl.addEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4));
        mainEl.addEventListener('mouseup', dragHandler.handleMouseUp);
        // 防止鼠标移出画布后还处于拖拽状态
        mainEl.addEventListener('mouseleave', dragHandler.handleMouseUp);

        return () => {
            mainEl.removeEventListener('wheel', wheelZoomHandler);
            mainEl.removeEventListener('mousedown', dragHandler.handleMouseDown);
            mainEl.removeEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4));
            mainEl.removeEventListener('mouseup', dragHandler.handleMouseUp);
            mainEl.removeEventListener('mouseleave', dragHandler.handleMouseUp);
        }
    }, [FLAG, container_ref, moveHook, zoomHook]);

    useEffect(() => {
        localStorage.setItem('mindmap', mindmap_json);
        hDispatch(setHistory(mindmap_json, nodeStatus.cur_select || nodeStatus.cur_edit));
    }, [hDispatch, mindmap_json, nodeStatus.cur_edit, nodeStatus.cur_select]);

    return (
        <div
            className={wrapper}
            ref={self}
            style={{ zoom: gState.zoom, left: gState.x + 'vw', top: gState.y + 'vh' }}
            id={refer.MINDMAP_ID}
            draggable={false}>
            <RootNode key={root_node.id} layer={0} node={root_node} node_refs={node_refs} />
            <DragCanvas parent_ref={self} container_ref={container_ref} mindmap={root_node} />
            <LineCanvas parent_ref={self} mindmap={root_node} node_refs={node_refs} />
        </div>
    );
};

export default Mindmap;

// CSS
const wrapper = css`
position: relative;
width: fit-content;
padding: 30vh 30vw;
cursor: grab;

&:active {
    cursor: grabbing;
}
`;