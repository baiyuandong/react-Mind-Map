const mousemoveInfo = {
    startX: 0,
    startY: 0,

    isDragging: false
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
            if (e.button === 0) {
                const target = e.target;
                const isNode = target.closest('[data-tag="dropArea"]') || 
                               target.closest('[id="rmind_root_node"]') ||
                               target.closest('[draggable="true"]') ||
                               target.tagName === 'P' ||
                               target.tagName === 'BUTTON' ||
                               target.closest('button');
                
                if (!isNode) {
                    mousemoveInfo.startX = e.clientX;
                    mousemoveInfo.startY = e.clientY;
                    mousemoveInfo.isDragging = false;
                }
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
            
            moveXY(movedX / zoomRate, movedY / zoomRate);
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

        if (e.ctrlKey === true && e.wheelDelta) {
            e.preventDefault()
            e.stopPropagation()
            getWheelDelta(e) > 0 ? zoomIn(e.clientX,e.clientY) : zoomOut(e.clientX,e.clientY)
            return;
        }

        if (e.buttons === 1 && e.type === 'mousedown') {
            mousemoveInfo.startX = e.clientX
            mousemoveInfo.startY = e.clientY
            return
        }

        if (e.altKey && e.buttons === 1) {
            e.stopPropagation()
            const { startX, startY } = mousemoveInfo;
            const movedX = (e.clientX - startX);
            const movedY = (e.clientY - startY);
            moveXY(movedX / 10 / normalizeXY, movedY / 10)
            mousemoveInfo.startX = e.clientX
            mousemoveInfo.startY = e.clientY
        }
    };

    return event => {
        try {
            handleWhellEventWithkey(event); // 据说在 try 代码块中写大量语句会影响性能，因此包装为函数
        } catch (e) {
            alert('移动或缩放功能异常',e);
        }
    };
};