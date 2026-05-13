import React, { useState, useEffect, useContext } from 'react';
import { css } from 'emotion';
import { context } from '../../context';
import useMindmap from '../../customHooks/useMindmap';
import { ROOT_NODE_ID } from '../../statics/refer';
import { setTitle } from '../../context/reducer/global/actionCreator';

const Home = () => {
    const { global: { dispatch: gDispatch } } = useContext(context);
    const { setMindmap } = useMindmap();
    const [records, setRecords] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = () => {
        try {
            const saved = localStorage.getItem('mindmap_records');
            const list = saved ? JSON.parse(saved) : [];
            setRecords(list.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch {
            setRecords([]);
        }
    };

    const saveRecord = (mindmap, title) => {
        try {
            const saved = localStorage.getItem('mindmap_records');
            const list = saved ? JSON.parse(saved) : [];
            const id = mindmap.id;
            const existing = list.findIndex(r => r.id === id);
            const record = {
                id,
                title,
                text: mindmap.text,
                childCount: countChildren(mindmap),
                updatedAt: Date.now(),
                snapshot: JSON.stringify(mindmap),
            };
            if (existing >= 0) {
                list[existing] = record;
            } else {
                list.push(record);
            }
            localStorage.setItem('mindmap_records', JSON.stringify(list));
            setRecords(list.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch (e) {
            console.error('保存记录失败', e);
        }
    };

    const countChildren = (node) => {
        if (!node.children || node.children.length === 0) return 0;
        return node.children.reduce((acc, child) => acc + 1 + countChildren(child), 0);
    };

    const handleOpenRecord = (record) => {
        try {
            const mindmap = JSON.parse(record.snapshot);
            if (mindmap && mindmap.id === ROOT_NODE_ID) {
                setMindmap(mindmap, false);
                gDispatch(setTitle(record.title));
                window.location.hash = 'editor';
            }
        } catch {
            alert('打开失败，记录已损坏');
        }
    };

    const handleNew = () => {
        setIsCreating(true);
    };

    const handleCreateNew = () => {
        const saved = localStorage.getItem('mindmap');
        if (saved) {
            const json = JSON.parse(saved);
            const title = localStorage.getItem('title') || '未命名导图';
            saveRecord(json, title);
        }
        setIsCreating(false);
        window.location.hash = 'editor';
    };

    const handleDeleteRecord = (e, id) => {
        e.stopPropagation();
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('确定要删除这条记录吗？')) return;
        try {
            const saved = localStorage.getItem('mindmap_records');
            const list = saved ? JSON.parse(saved) : [];
            const filtered = list.filter(r => r.id !== id);
            localStorage.setItem('mindmap_records', JSON.stringify(filtered));
            setRecords(filtered);
        } catch (e) {
            console.error('删除记录失败', e);
        }
    };

    const formatDate = (timestamp) => {
        const d = new Date(timestamp);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <div className={container}>
            <div className={header}>
                <h1 className={title}>RMind</h1>
                <p className={subtitle}>简洁高效的在线思维导图工具</p>
            </div>

            <div className={actions}>
                <button className={primaryBtn} onClick={handleCreateNew}>
                    <span className={btnIcon}>+</span>
                    {isCreating ? '正在进入编辑...' : '新建导图'}
                </button>
            </div>

            {records.length > 0 && (
                <div className={section}>
                    <h2 className={sectionTitle}>最近编辑</h2>
                    <div className={grid}>
                        {records.map(record => (
                            <div
                                key={record.id}
                                className={card}
                                onClick={() => handleOpenRecord(record)}
                            >
                                <div className={cardHeader}>
                                    <span className={cardTitle}>{record.title}</span>
                                    <button
                                        className={deleteBtn}
                                        onClick={(e) => handleDeleteRecord(e, record.id)}
                                        title="删除"
                                    >×</button>
                                </div>
                                <div className={cardMeta}>
                                    <span className={metaItem}>
                                        <span className={metaLabel}>根节点</span>
                                        <span className={metaValue}>{record.text}</span>
                                    </span>
                                    <span className={metaItem}>
                                        <span className={metaLabel}>子节点</span>
                                        <span className={metaValue}>{record.childCount}</span>
                                    </span>
                                    <span className={metaItem}>
                                        <span className={metaLabel}>更新时间</span>
                                        <span className={metaValue}>{formatDate(record.updatedAt)}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {records.length === 0 && (
                <div className={empty}>
                    <p>还没有保存过思维导图</p>
                    <p className={emptyHint}>在编辑器中创建导图后，会自动出现在这里</p>
                </div>
            )}
        </div>
    );
};

export default Home;

// CSS
const container = css`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 20px;
    box-sizing: border-box;
`;

const header = css`
    text-align: center;
    margin-bottom: 40px;
`;

const title = css`
    font-size: 48px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 10px;
    letter-spacing: 4px;
`;

const subtitle = css`
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
`;

const actions = css`
    display: flex;
    justify-content: center;
    margin-bottom: 50px;
`;

const primaryBtn = css`
    background: #fff;
    color: #667eea;
    border: none;
    border-radius: 50px;
    padding: 16px 48px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    letter-spacing: 2px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    }

    &:active {
        transform: translateY(0);
    }
`;

const btnIcon = css`
    font-size: 24px;
    font-weight: 700;
`;

const section = css`
    max-width: 900px;
    margin: 0 auto;
`;

const sectionTitle = css`
    color: rgba(255, 255, 255, 0.9);
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 20px;
    padding-left: 4px;
`;

const grid = css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
`;

const card = css`
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
`;

const cardHeader = css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
`;

const cardTitle = css`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    word-break: break-word;
    flex: 1;
`;

const deleteBtn = css`
    background: none;
    border: none;
    color: #999;
    font-size: 22px;
    cursor: pointer;
    padding: 0 0 0 8px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.2s;

    &:hover {
        color: #e74c3c;
    }
`;

const cardMeta = css`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const metaItem = css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
`;

const metaLabel = css`
    color: #999;
    min-width: 60px;
`;

const metaValue = css`
    color: #666;
`;

const empty = css`
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    padding: 40px 0;

    p {
        margin: 0 0 8px;
        font-size: 16px;
    }
`;

const emptyHint = css`
    font-size: 14px !important;
    opacity: 0.7;
`;
