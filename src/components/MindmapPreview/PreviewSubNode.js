import React from 'react';
import { css, cx } from 'emotion';
import PreviewNode from './PreviewNode';

const PreviewSubNode = ({ layer, node, node_refs, parent, on_left }) => {
    return (<div className={cx(wrapper, { [left_style]: on_left })}>
        <PreviewNode layer={layer} node={node} node_refs={node_refs} parent={parent} on_left={on_left} />
        <div>
            {node.showChildren && node.children.map(sub_node => <PreviewSubNode key={sub_node.id} layer={layer + 1}
                                                                         node={sub_node} node_refs={node_refs}
                                                                         parent={node} on_left={on_left} />)}
        </div>
    </div>);
};

export default PreviewSubNode;

const wrapper = css`
    display: flex;
    align-items: center;
`;

const left_style = css`
    flex-direction: row-reverse;
`;
