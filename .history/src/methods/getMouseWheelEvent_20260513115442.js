import * as refer from '../statics/refer';

const mousemoveInfo = {
    startX: 0,
    startY: 0,
    isDragging: false
};

// 判断是否点击到了思维导图节点或其子元素
const isNodeElement = (target) => {
    return target.closest(`[data-tag="${refer.DROP_AREA}"]`) ||
           target.closest(`[data-tag="${refer.LEFT_NODE}"]`) ||
           target.closest(`[data-tag="${refer.RIGHT_NODE}"]`) ||
           target.closest(`[id="${refer.ROOT_NODE_ID}"]`) ||
           target.closest('p') ||
           target.closest('button') ||
           target.closest('canvas');
};

// 专门处理滚轮缩放：Ctrl + 滚轮
const createWheelZoomHandler = (zoomHook) => {
    const { zoomIn, zoomOut } = zoomHook;
    return (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            if (e.deltaY < 0) {
                zoomIn(e.clientX, e.clientY);
            } else {
                zoomOut(e.clientX, e.clientY);
            }
        }
    };
};

// 专门处理鼠标拖拽移动画布：在空白区域左键拖拽
const createMouseDragHandler = (moveHook, zoomRate) => {
    const { moveXY } = moveHook;
    return {
        handleMouseDown: (e) => {
            // 只有左键点击 (button === 0)，且点击的不是节点元素
            if (e.button === 0 && !isNodeElement(e.target)) {
                mousemoveInfo.startX = e.clientX;
                mousemoveInfo.startY = e.clientY;
                mousemoveInfo.isDragging = false;
            }
        },
        handleMouseMove: (e) => {
            if (mousemoveInfo.startX === 0 && mousemoveInfo.startY === 0) return;
            
            const movedX = e.clientX - mousemoveInfo.startX;
            const movedY = e.clientY - mousemoveInfo.startY;
            
            if (!mousemoveInfo.isDragging) {
                // 移动超过5px才认为是拖拽（而不是点击）
                if (Math.abs(movedX) > 5 || Math.abs(movedY) > 5) {
                    mousemoveInfo.isDragging = true;
                } else {
                    return;
                }
            }
            

            // 将像素转换为 vw/vh：1vw = 视口宽度/100 px, 1vh = 视口高度/100 px
            const vwX = movedX / (window.innerWidth / 100);
            const vhY = movedY / (window.innerHeight / 100);
            moveXY(vwX, vhY);
            mousemoveInfo.startX = e.clientX;
            mousemoveInfo.startY = e.clientY;
        },
        handleMouseUp: () => {
            mousemoveInfo.startX = 0;
            mousemoveInfo.startY = 0;
            mousemoveInfo.isDragging = false;
        }
    };
};

export { createWheelZoomHandler, createMouseDragHandler };

// 保留旧的导出以兼容（但改为新实现）
export default (propHook, zoomRate, normalizeXY) => {
    const { zoomIn, zoomOut, moveXY } = propHook;

    const handleWhellEventWithkey = e => {
        // Ctrl + 滚轮 = 缩放
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            if (e.deltaY < 0) {
                zoomIn(e.clientX, e.clientY);
            } else {
                zoomOut(e.clientX, e.clientY);
            }
            return;
        }

        // 鼠标左键在空白区域拖拽移动
        if (e.type === 'mousedown' && e.button === 0 && !isNodeElement(e.target)) {
            mousemoveInfo.startX = e.clientX;
            mousemoveInfo.startY = e.clientY;
            mousemoveInfo.isDragging = false;
            return;
        }

        if (e.type === 'mousemove' && mousemoveInfo.startX !== 0 && mousemoveInfo.startY !== 0) {
            const movedX = e.clientX - mousemoveInfo.startX;
            const movedY = e.clientY - mousemoveInfo.startY;
            
            if (!mousemoveInfo.isDragging) {
                if (Math.abs(movedX) > 5 || Math.abs(movedY) > 5) {
                    mousemoveInfo.isDragging = true;
                } else {
                    return;
                }
            }
            
            moveXY(movedX / 10 / (normalizeXY || 1), movedY / 10);
            mousemoveInfo.startX = e.clientX;
            mousemoveInfo.startY = e.clientY;
        }

        if (e.type === 'mouseup') {
            mousemoveInfo.startX = 0;
            mousemoveInfo.startY = 0;
            mousemoveInfo.isDragging = false;
        }
    };

    return event => {
        try {
            handleWhellEventWithkey(event);
        } catch (e) {
            console.error('移动或缩放功能异常', e);
        }
    };
};