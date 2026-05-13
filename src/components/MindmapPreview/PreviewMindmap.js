import React, { useRef, useContext, useEffect, useState, useMemo } from 'react';
import { css } from 'emotion';
import * as refer from '../../statics/refer';
import { context } from '../../context';
import useMindmap from '../../customHooks/useMindmap';
import useZoom from '../../customHooks/useZoom';
import useMove from '../../customHooks/useMove';
import { debounce } from '../../methods/assistFunctions';
import { createWheelZoomHandler, createMouseDragHandler } from '../../methods/getMouseWheelEvent';
import PreviewRootNode from './PreviewRootNode';
import DragCanvas from '../../components/DragCanvas';
import LineCanvas from '../../components/LineCanvas';

const node_refs = new Set();

const PreviewMindmap = ({ container_ref, onNodeSelect }) => {
    const self = useRef();
    const { mindmap: { state: root_node }, nodeStatus: { state: nodeStatus }, global: { state: gState } } = useContext(context);

    const mindmapHook = useMindmap();
    const zoomHook = useZoom();
    const moveHook = useMove();
    const { clearNodeStatus } = mindmapHook;
    const [FLAG, setFLAG] = useState(0);

    const mindmap_json = useMemo(() => JSON.stringify(root_node), [root_node]);

    useEffect(() => {
        window.addEventListener('click', clearNodeStatus);
        return () => {
            window.removeEventListener('click', clearNodeStatus);
        }
    }, [clearNodeStatus]);

    useEffect(() => {
        window.addEventListener('resize', () => setFLAG(Date.now()));
        return () => {
            window.removeEventListener('resize', () => setFLAG(Date.now()));
        }
    }, []);

    useEffect(() => {
        const mainEl = document.querySelector(`#${refer.MINDMAP_MAIN}`);
        if (!mainEl) return;

        const wheelZoomHandler = createWheelZoomHandler(zoomHook);
        mainEl.addEventListener('wheel', wheelZoomHandler, { passive: false });

        const dragHandler = createMouseDragHandler(moveHook);
        mainEl.addEventListener('mousedown', dragHandler.handleMouseDown);
        mainEl.addEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4));
        mainEl.addEventListener('mouseup', dragHandler.handleMouseUp);
        mainEl.addEventListener('mouseleave', dragHandler.handleMouseUp);

        return () => {
            mainEl.removeEventListener('wheel', wheelZoomHandler);
            mainEl.removeEventListener('mousedown', dragHandler.handleMouseDown);
            mainEl.removeEventListener('mousemove', debounce(dragHandler.handleMouseMove, 4));
            mainEl.removeEventListener('mouseup', dragHandler.handleMouseUp);
            mainEl.removeEventListener('mouseleave', dragHandler.handleMouseUp);
        }
    }, [FLAG, container_ref, moveHook, zoomHook]);

    const findNode = (node, id) => {
        if (node.id === id) return node;
        for (const child of node.children || []) {
            const found = findNode(child, id);
            if (found) return found;
        }
        return null;
    };

    useEffect(() => {
        if (onNodeSelect && nodeStatus.cur_select) {
            const selectedNode = findNode(root_node, nodeStatus.cur_select);
            onNodeSelect(selectedNode);
        } else if (onNodeSelect && !nodeStatus.cur_select) {
            onNodeSelect(null);
        }
    }, [nodeStatus.cur_select, root_node, onNodeSelect]);

    return (
        <div
            className={wrapper}
            ref={self}
            style={{ zoom: gState.zoom, left: gState.x + 'vw', top: gState.y + 'vh' }}
            id={refer.MINDMAP_ID}
            draggable={false}>
            <PreviewRootNode key={root_node.id} layer={0} node={root_node} node_refs={node_refs} />
            <DragCanvas parent_ref={self} container_ref={container_ref} mindmap={root_node} readOnly={true} />
            <LineCanvas parent_ref={self} mindmap={root_node} node_refs={node_refs} />
        </div>
    );
};

export default PreviewMindmap;

const wrapper = css`
    position: relative;
    width: fit-content;
    padding: 30vh 30vw;
    cursor: grab;

    &:active {
        cursor: grabbing;
    }
`;
