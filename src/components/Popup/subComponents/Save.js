import React, { useState, useContext } from 'react';
import { css } from 'emotion';
import { context } from '../../../context';
import mindmapExporter from '../../../methods/mindmapExporter';
import mindmapApi from '../../../services/mindmapApi';
import { Highlight, ButtonSet } from '../common/styledComponents';
import { ROOT_NODE_ID } from '../../../statics/refer';

const Save = ({ handleClosePopup }) => {
    const { mindmap: { state: mindmap }, global: { state: { title } } } = useContext(context);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const jsonData = mindmapExporter(mindmap, 'JSON');
            const data = JSON.parse(jsonData);

            await mindmapApi.save({
                title,
                data
            });

            setMessage('保存成功！');
            setMessageType('success');

            setTimeout(() => {
                handleClosePopup();
            }, 1000);
        } catch (error) {
            setMessage(error.message || '保存失败，请重试');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    return (<div>
        <Highlight>保存到服务器</Highlight>
        <p className={info}>当前文件：<strong>{title}</strong></p>

        {message && (
            <p className={`${message_style} ${messageType === 'error' ? error_style : success_style}`}>
                {message}
            </p>
        )}

        <ButtonSet>
            <button
                className={primary_button}
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={handleClosePopup} disabled={saving}>取消</button>
        </ButtonSet>
    </div>);
};

export default Save;

const info = css`
    margin: 15px 0;
    font-size: 14px;
    color: #666;
`;

const message_style = css`
    margin: 10px 0;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
`;

const success_style = css`
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
`;

const error_style = css`
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
`;

const primary_button = css`
    background-color: var(--theme-main, #1890ff);
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
        opacity: 0.9;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
