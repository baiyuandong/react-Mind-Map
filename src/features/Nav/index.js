import React, { useState, useContext } from 'react';
import { css } from 'emotion';
import { context } from '../../context';
import useMindmap from '../../customHooks/useMindmap';
import useHistory from '../../customHooks/useHistory';
import useZoom from '../../customHooks/useZoom';
import useMove from '../../customHooks/useMove';
import * as refer from '../../statics/refer';
import * as popupType from '../../components/Popup/common/popupType';
import { handlePropagation, downloadFile } from '../../methods/assistFunctions'; // 防止 Mindmap 中的选中状态由于冒泡被清除
import ToolButton from '../../components/ToolButton';
import mindmapExporter from '../../methods/mindmapExporter';
import MindmapTitle from '../../components/MindmapTitle';
import Popup from '../../components/Popup';
import SearchBox from '../../components/SearchBox';

const Nav = () => {
    const [popup, setPopup] = useState(popupType.NONE);
    const { mindmap: { state: mindmap }, history: { state: history }, global: { state: { title } } } = useContext(context);
    const { expandAll } = useMindmap();
    const { zoomIn, zoomOut, zoomReset } = useZoom();
    const { moveXY, moveReset } = useMove()
    const { undoHistory, redoHistory } = useHistory();

    const handleClosePopup = () => {
        setPopup(popupType.NONE);
    };

    const handleNewFile = () => {
        setPopup(popupType.NEW);
    };

    const handleDownload = () => {
        const url = `data:text/plain,${encodeURIComponent(JSON.stringify(mindmap))}`;
        downloadFile(url, `${title}.rmf`);
    };

    const handleOpenFile = () => {
        setPopup(popupType.OPEN);
    };

    const handleExport = () => {
        setPopup(popupType.EXPORT);
    };

    const countChildren = (node) => {
        if (!node.children || node.children.length === 0) return 0;
        return node.children.reduce((acc, child) => acc + 1 + countChildren(child), 0);
    };

    const saveRecord = () => {
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
        } catch (e) {
            console.error('保存记录失败', e);
        }
    };

    const handleSave = () => {
        saveRecord();
        const jsonData = mindmapExporter(mindmap, 'JSON');
        console.log('保存数据：', jsonData);
    };

    const handleGoHome = () => {
        saveRecord();
        window.location.hash = 'home';
    };

    const handleTheme = () => {
        setPopup(popupType.THEME);
    };

    const handleKnowledgeSystem = () => {
        setPopup(popupType.KNOWLEDGE_SYSTEM);
    };

    const handleUndo = () => {
        undoHistory();
    };

    const handleRedo = () => {
        redoHistory();
    };

    const handleExpand = () => {
        expandAll(refer.ROOT_NODE_ID);
    };

    const handleZoom = (zoom) => {
        console.log('缩放', zoom ? zoom : '还原')
        switch (zoom) {
            case 'in':
                zoomIn()
                break;
            case 'out':
                zoomOut()
                break;
            default:
                zoomReset()
        }
    }

    const handleMove = (move) => {
        console.log('移动', move ? move : '还原')
        switch (move) {
            case 'up':
                moveXY(0,-5)
                break;
            case 'down':
                moveXY(0,5)
                break;
            case 'left':
                moveXY(-5,0)
                break;
            case 'right':
                moveXY(5,0)
                break;
            default:
                moveReset()
        }
    }

    return (<nav className={wrapper}>
        <section className={section} onClick={handlePropagation}>
            <ToolButton icon={'home'} onClick={handleGoHome}>首页</ToolButton>
            <ToolButton icon={'add-item-alt'} onClick={handleNewFile}>新建</ToolButton>
            <ToolButton icon={'folder-open'} onClick={handleOpenFile}>打开</ToolButton>
            <ToolButton icon={'file-download'} onClick={handleDownload}>下载至本地</ToolButton>
            <ToolButton icon={'duplicate'} onClick={handleExport}>导出</ToolButton>
            <ToolButton icon={'floppy'} onClick={handleSave}>保存</ToolButton>
            <ToolButton icon={'palette'} onClick={handleTheme}>主题</ToolButton>
            <ToolButton icon={'book'} onClick={handleKnowledgeSystem}>知识体系</ToolButton>
            <ToolButton icon={'plus-circle'} onClick={() => handleZoom('in')}>放大</ToolButton>
            <ToolButton icon={'minus-circle'} onClick={() => handleZoom('out')}>缩小</ToolButton>
            <ToolButton icon={'rotate-left'} onClick={() => handleZoom()}>还原</ToolButton>
        </section>
        <section className={section}>
            <MindmapTitle />
            <SearchBox />
        </section>
        <section className={section} onClick={handlePropagation}>
            <ToolButton icon={'rotate-left'} onClick={() => handleMove()}>还原</ToolButton>
            <ToolButton icon={'undo'} disabled={history.undo.length === 0} onClick={handleUndo}>撤销</ToolButton>
            <ToolButton icon={'redo'} disabled={history.redo.length === 0} onClick={handleRedo}>重做</ToolButton>
            <ToolButton icon={'scale'} onClick={handleExpand}>展开所有节点</ToolButton>
        </section>
        {popup !== popupType.NONE &&
            <Popup type={popup} handleClosePopup={handleClosePopup} handleDownload={handleDownload}
                width={popup === popupType.KNOWLEDGE_SYSTEM ? 780 : undefined} />}
    </nav>);
};

export default Nav;

// CSS
const wrapper = css`
display: flex;
justify-content: space-between;
position: fixed;
top:0;
left:0;
right:0;
height: 56px;
padding: 0 50px;
font-size: 25px;
background-color: #ffffff;
box-shadow: 0 0px 2px #aaaaaa;
z-index: 10;
`;

const section = css`
display: flex;
font-size: 15px;
`;