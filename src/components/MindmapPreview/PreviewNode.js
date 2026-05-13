import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { css, cx } from 'emotion';
import { context } from '../../context';
import useMindmap from "../../customHooks/useMindmap";
import { getNodeInfo } from '../../context/reducer/nodeStatus/actionCreator';
import * as refer from '../../statics/refer';
import { handlePropagation } from '../../methods/assistFunctions';
import PreviewToolbar from './PreviewToolbar';
import MdPreview from '../mdPreview';

const PreviewNode = ({ layer, node, parent, node_refs, on_left }) => {
    const self = useRef();
    const isRightClick = useRef(false);
    const { nodeStatus: { state: nodeStatus, dispatch: nDispatch } } = useContext(context);
    const mindmapHook = useMindmap();

    const [contextMenuPos, setContextMenuPos] = useState(null);

    const handleSelectNode = () => {
        mindmapHook.selectNode(node.id, true);
    };

    const handleToggleChildren = () => {
        mindmapHook.toggleChildren(node.id, !node.showChildren);
        mindmapHook.clearNodeStatus();
    };

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        isRightClick.current = true;
        mindmapHook.selectNode(node.id, true);
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenuPos({ x: rect.right, y: rect.top });
    }, [node.id, mindmapHook]);

    const handleCloseMenu = useCallback(() => {
        setContextMenuPos(null);
    }, []);

    useEffect(() => {
        node_refs.add(self);
        return () => {
            node_refs.delete(self);
        }
    }, [node_refs]);

    useEffect(() => {
        if (nodeStatus.cur_select === node.id) {
            if (!isRightClick.current) {
                self.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
            isRightClick.current = false;
            nDispatch(getNodeInfo(node, parent, on_left));
        }
    }, [nodeStatus.cur_select, node, nDispatch, parent, on_left]);

    return (<div
        className={cx(common_style, specific_style[layer < 3 ? layer : 3], { [seleted_style]: nodeStatus.cur_select === node.id })}
        data-tag={on_left ? refer.LEFT_NODE : refer.RIGHT_NODE}
        data-parent={parent.id}
        data-show-children={node.showChildren}
        id={node.id}
        ref={self}
        onClick={handlePropagation}
        onContextMenu={handleContextMenu}>
        <div className={drop_area} data-tag={refer.DROP_AREA} onClick={handleSelectNode} />
        <p>{node.text} {node.info && <MdPreview mdtext={node.info} />}</p>
        {(layer > 0 && node.children.length > 0) &&
            <button className={cx(toggle_button, (on_left ? button_left : button_right))} onClick={handleToggleChildren}>{node.showChildren ? '-' : '+'}</button>}
        {contextMenuPos && (
            <PreviewToolbar
                node={node}
                x={contextMenuPos.x}
                y={contextMenuPos.y}
                onClose={handleCloseMenu}
            />
        )}
    </div>);
};

export default PreviewNode;

const style_selected_border = `
    box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px var(${refer.THEME_EX});
`;

const common_style = css`
    position: relative;
    min-width: 10px;
    max-width: 200px;
    margin: 20px 40px;
    padding: 15px;
    background-color: #ffffff;
    border: 1px solid var(${refer.THEME_MAIN});
    border-radius: 15px;
    cursor: pointer;

    p {
        min-height: 18px;
        margin: 0;
        line-height: 1.5em;
        overflow-wrap: break-word;
    }

    &:hover {
        ${style_selected_border}
    }
`;

const specific_style = [
    css`
        div& {
            padding: 15px 20px;
            color: #ffffff;
            font-size: 120%;
            font-weight: 700;
            background-color: var(${refer.THEME_DARK});
            border:2px solid var(${refer.THEME_EX});
        }
    `,
    css`
        div& {
            background-color: var(${refer.THEME_LIGHT});
        }
    `,
    css`
        div& {
            padding: 10px 15px;
        }
    `,
    css`
        div& {
            padding: 0 15px;
            border: none;
            p {
                font-size: 90%;
            }
        }
    `
];

const seleted_style = css`
    z-index: 1;
    ${style_selected_border}
`;

const drop_area = css`
    position: absolute;
    top:0;
    bottom:0;
    left:0;
    right:0;
`;

const toggle_button = css`
    position: absolute;
    top:0;
    bottom: 0;
    width: 20px;
    height: 20px;
    margin: auto 0;
    padding: 0;
    text-align: center;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    border-radius: 50%;
    outline: none;
    cursor: pointer;
`;

const button_left = css`
    left: -15px;
`;

const button_right = css`
    right: -15px;
`;
