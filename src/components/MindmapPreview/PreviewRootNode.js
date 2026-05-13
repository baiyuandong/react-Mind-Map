import React, { useEffect, useRef } from 'react';
import { css } from 'emotion';
import { ROOT_PARENT } from '../../statics/refer';
import PreviewNode from './PreviewNode';
import PreviewSubNode from './PreviewSubNode';

const PreviewRootNode = ({ layer, node, node_refs }) => {
    const root_node = useRef();

    const total = node.children.length,
        half = total > 3 ? Math.trunc(total / 2) : total;

    useEffect(() => {
        root_node.current.scrollIntoView({ block: 'center', inline: 'center' });
    }, []);

    return (<div className={wrapper}>
        <div>
            {node.showChildren && node.children.slice(half).map(sub_node => <PreviewSubNode
                key={sub_node.id}
                layer={layer + 1}
                node={sub_node}
                node_refs={node_refs}
                parent={node} on_left={true} />)}
        </div>
        <div ref={root_node}>
            <PreviewNode layer={0} node={node} node_refs={node_refs} parent={ROOT_PARENT} />
        </div>
        <div>
            {node.showChildren && node.children.slice(0, half).map(sub_node => <PreviewSubNode
                key={sub_node.id}
                layer={layer + 1}
                node={sub_node}
                node_refs={node_refs}
                parent={node}
                on_left={false} />)}
        </div>
    </div>);
};

export default PreviewRootNode;

const wrapper = css`
    display: flex;
    align-items: center;
    width: max-content;
`;
