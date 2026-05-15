import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  MindMapNode,
  HistorySnapshot,
  KnowledgePoint,
  Theme,
} from "./types";
import { ROOT_NODE_ID, NEW_NODE_TEXT, DEFAULT_THEME_LIST } from "./types";
import defaultMindmap from "./utils/defaultMindmap";
import {
  deepCopy,
  findNode,
  setShowChildrenTrue,
} from "./utils/assistFunctions";

// ===== 辅助函数 =====
function createNewNode(newNodeId: string, parentId: string): MindMapNode {
  return {
    id: newNodeId,
    text: NEW_NODE_TEXT,
    showChildren: true,
    children: [],
    parent_id: parentId,
    knowledgePoints: [],
  };
}

// ===== Store 接口 =====
export interface MindMapStore {
  mindmap: MindMapNode;
  curSelect: string;
  selectByClick: boolean;
  curEdit: string;
  curNodeInfo: {
    id: string;
    text: string;
    showChildren: boolean;
    children: MindMapNode[];
    info?: string;
    parent: MindMapNode | { id: string; children: MindMapNode[] };
    on_left: boolean;
    parent_id: string;
    knowledgePoints: KnowledgePoint[];
  };
  history: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  lastSnapshot: HistorySnapshot | null;
  zoom: number;
  x: number;
  y: number;
  themeIndex: number;
  editPanelShow: boolean;
  editNodeId: string;
  knowledgePointModalShow: boolean;
  knowledgePointNodeId: string;
  knowledgeDrawerShow: boolean;
  knowledgeDrawerNodeId: string;

  // 操作
  toggleChildren: (nodeId: string, bool: boolean) => void;
  addChild: (nodeId: string) => void;
  addSibling: (nodeId: string, parentId: string) => void;
  moveNode: (
    nodeId: string,
    targetId: string,
    parentId: string,
    isSibling: boolean,
  ) => void;
  changeText: (nodeId: string, text: string) => void;
  editNodeInfo: (nodeId: string, info: string) => void;
  selectNode: (nodeId: string, selectByClick?: boolean) => void;
  editNode: (nodeId: string) => void;
  deleteNode: (nodeId: string, parentId: string) => void;
  clearNodeStatus: () => void;
  setMindmap: (mindmap: MindMapNode) => void;
  expandAll: (nodeId: string) => void;
  undoHistory: () => void;
  redoHistory: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  moveXY: (x: number, y: number) => void;
  moveReset: () => void;
  toggleEditPanel: (isShow: boolean) => void;
  toggleKnowledgePointModal: (isShow: boolean, nodeId?: string) => void;
  toggleKnowledgeDrawer: (isShow: boolean, nodeId?: string) => void;
  addKnowledgePoint: (nodeId: string, point: KnowledgePoint) => void;
  updateKnowledgePoint: (
    nodeId: string,
    pointId: string,
    point: Partial<KnowledgePoint>,
  ) => void;
  deleteKnowledgePoint: (nodeId: string, pointId: string) => void;

  // 对外接口
  loadMindmap: (mindmap: MindMapNode) => void;
  getMindmap: () => MindMapNode;
  getTheme: () => Theme;
  setTheme: (index: number) => void;
  getThemeList: () => Theme[];
  saveSnapshot: () => void;
}

const initialNodeInfo = {
  id: "",
  text: "",
  showChildren: true,
  children: [] as MindMapNode[],
  parent: { id: "", children: [] as MindMapNode[] },
  parent_id: "",
  on_left: false,
  knowledgePoints: [],
};

// 从 localStorage 恢复
function loadInitialMindmap(): MindMapNode {
  try {
    const stored = localStorage.getItem("mindmap");
    return stored ? JSON.parse(stored) : defaultMindmap;
  } catch {
    return defaultMindmap;
  }
}

const useMindMapStore = create<MindMapStore>((set, get) => ({
  mindmap: loadInitialMindmap(),
  curSelect: "",
  selectByClick: false,
  curEdit: "",
  curNodeInfo: initialNodeInfo,
  history: [] as HistorySnapshot[],
  redoStack: [],
  lastSnapshot: null,
  zoom: 1,
  x: 0,
  y: 0,
  themeIndex: 0,
  editPanelShow: false,
  editNodeId: "",
  knowledgePointModalShow: false,
  knowledgePointNodeId: "",
  knowledgeDrawerShow: false,
  knowledgeDrawerNodeId: "",

  saveSnapshot: () => {
    const state = get();
    const snapshot: HistorySnapshot = {
      mindmap: JSON.stringify(state.mindmap),
      cur_node: state.curSelect,
    };

    if (state.lastSnapshot) {
      const newHistory = [...state.history];
      const lastMindmap = state.lastSnapshot.mindmap;

      if (
        newHistory.length > 0 &&
        newHistory[newHistory.length - 1].mindmap === snapshot.mindmap
      ) {
        const newRedo = [state.lastSnapshot, ...state.redoStack];
        newHistory.pop();
        set({
          history: newHistory,
          redoStack: newRedo,
          lastSnapshot: snapshot,
        });
        return;
      }

      if (
        state.redoStack.length > 0 &&
        state.redoStack[0].mindmap === snapshot.mindmap
      ) {
        newHistory.push(state.lastSnapshot);
        const newRedo = state.redoStack.slice(1);
        set({
          history: newHistory,
          redoStack: newRedo,
          lastSnapshot: snapshot,
        });
        return;
      }

      newHistory.push(state.lastSnapshot);
      set({ history: newHistory, redoStack: [], lastSnapshot: snapshot });
    } else {
      set({ lastSnapshot: snapshot });
    }
  },

  toggleChildren: (nodeId: string, bool: boolean) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (
      nodeFound &&
      nodeFound.children.length > 0 &&
      nodeFound !== newMindmap
    ) {
      nodeFound.showChildren = bool;
    }
    set({ mindmap: newMindmap });
    state.saveSnapshot();
  },

  addChild: (nodeId: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound) {
      nodeFound.showChildren = true;
      const newNodeId = uuidv4();
      nodeFound.children.push(createNewNode(newNodeId, nodeId));
      set({
        mindmap: newMindmap,
        curSelect: "",
        curEdit: newNodeId,
        curNodeInfo: initialNodeInfo,
      });
    }
    state.saveSnapshot();
  },

  addSibling: (nodeId: string, parentId: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    if (parentId) {
      const nodeFound = findNode(newMindmap, parentId);
      if (nodeFound) {
        const insertIndex =
          nodeFound.children.findIndex((node) => node.id === nodeId) + 1;
        const newNodeId = uuidv4();
        nodeFound.children.splice(
          insertIndex,
          0,
          createNewNode(newNodeId, parentId),
        );
        set({
          mindmap: newMindmap,
          curSelect: "",
          curEdit: newNodeId,
          curNodeInfo: initialNodeInfo,
        });
      }
    }
    state.saveSnapshot();
  },

  moveNode: (
    nodeId: string,
    targetId: string,
    parentId: string,
    isSibling: boolean,
  ) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const parent = findNode(newMindmap, parentId);
    if (parent) {
      const nodeIndex = parent.children.findIndex((node) => node.id === nodeId);
      if (nodeIndex >= 0) {
        const [nodeCopy] = parent.children.splice(nodeIndex, 1);
        if (isSibling) {
          const targetIndex = parent.children.findIndex(
            (node) => node.id === targetId,
          );
          // 同级移动：新父节点仍为 parentId
          nodeCopy.parent_id = parentId;
          const insertAt =
            targetIndex >= 0 ? targetIndex + 1 : parent.children.length;
          parent.children.splice(insertAt, 0, nodeCopy);
        } else {
          const targetNode = findNode(newMindmap, targetId);
          if (targetNode) {
            // 作为子节点移动：更新 parent_id 为目标节点 id
            nodeCopy.parent_id = targetNode.id;
            targetNode.children.push(nodeCopy);
          }
        }
        set({
          mindmap: newMindmap,
          curSelect: nodeId,
          curNodeInfo: initialNodeInfo,
        });
      }
    }
    state.saveSnapshot();
  },

  changeText: (nodeId: string, text: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound) {
      nodeFound.text = text;
      set({ mindmap: newMindmap });
    }
    state.saveSnapshot();
  },

  editNodeInfo: (nodeId: string, info: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound) {
      nodeFound.info = info;
      set({ mindmap: newMindmap });
    }
    state.saveSnapshot();
  },

  selectNode: (nodeId: string, selectByClick?: boolean) => {
    const state = get();
    const findNodeInfo = (
      node: MindMapNode,
      searchId: string,
      parent: MindMapNode | { id: string; children: MindMapNode[] } = {
        id: "",
        children: [],
      },
      onLeft = false,
    ): typeof state.curNodeInfo | null => {
      if (node.id === searchId) {
        return {
          id: node.id,
          text: node.text,
          showChildren: node.showChildren,
          children: node.children,
          info: node.info,
          parent,
          on_left: onLeft,
          parent_id: parent.id,
          knowledgePoints: node.knowledgePoints,
        };
      }
      for (const child of node.children) {
        const found = findNodeInfo(child, searchId, node, onLeft);
        if (found) return found;
      }
      return null;
    };

    const nodeInfo = findNodeInfo(state.mindmap, nodeId) || initialNodeInfo;
    set({
      curSelect: nodeId,
      selectByClick: selectByClick || false,
      curEdit: "",
      curNodeInfo: nodeInfo,
    });
  },

  editNode: (nodeId: string) => {
    set({ curSelect: "", curEdit: nodeId, curNodeInfo: initialNodeInfo });
  },

  deleteNode: (nodeId: string, parentId: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    if (parentId) {
      const nodeFound = findNode(newMindmap, parentId);
      if (nodeFound) {
        const deleteIndex = nodeFound.children.findIndex(
          (node) => node.id === nodeId,
        );
        if (deleteIndex >= 0) {
          nodeFound.children.splice(deleteIndex, 1);
          set({
            mindmap: newMindmap,
            curSelect: parentId,
            curNodeInfo: initialNodeInfo,
          });
        }
      }
    }
    state.saveSnapshot();
  },

  clearNodeStatus: () => {
    set({
      curSelect: "",
      selectByClick: false,
      curEdit: "",
      curNodeInfo: initialNodeInfo,
    });
  },

  setMindmap: (mindmap: MindMapNode) => {
    set({ mindmap });
    get().saveSnapshot();
  },

  expandAll: (nodeId: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound) {
      setShowChildrenTrue(nodeFound);
      set({
        mindmap: newMindmap,
        curSelect: nodeId,
        curNodeInfo: initialNodeInfo,
      });
    }
    state.saveSnapshot();
  },

  undoHistory: () => {
    const state = get();
    const snapshot = state.history[state.history.length - 1];
    if (snapshot) {
      const newHistory = state.history.slice(0, -1);
      const newRedo = state.lastSnapshot
        ? [state.lastSnapshot, ...state.redoStack]
        : state.redoStack;
      const mindmap = JSON.parse(snapshot.mindmap) as MindMapNode;
      set({
        mindmap,
        curSelect: snapshot.cur_node,
        curNodeInfo: initialNodeInfo,
        history: newHistory,
        redoStack: newRedo,
        lastSnapshot: snapshot,
      });
    }
  },

  redoHistory: () => {
    const state = get();
    const snapshot = state.redoStack[0];
    if (snapshot) {
      const newRedo = state.redoStack.slice(1);
      const newHistory = state.lastSnapshot
        ? [...state.history, state.lastSnapshot]
        : state.history;
      const mindmap = JSON.parse(snapshot.mindmap) as MindMapNode;
      set({
        mindmap,
        curSelect: snapshot.cur_node,
        curNodeInfo: initialNodeInfo,
        history: newHistory,
        redoStack: newRedo,
        lastSnapshot: snapshot,
      });
    }
  },

  zoomIn: () => {
    set((state) => ({ zoom: Math.min(state.zoom + 0.1, 3) }));
  },

  zoomOut: () => {
    set((state) => ({ zoom: Math.max(state.zoom - 0.1, 0.3) }));
  },

  zoomReset: () => {
    set({ zoom: 1 });
  },

  moveXY: (x: number, y: number) => {
    set((state) => ({
      x: state.x + x / state.zoom,
      y: state.y + y / state.zoom,
    }));
  },

  moveReset: () => {
    set({ x: 0, y: 0 });
  },

  toggleKnowledgePointModal: (isShow: boolean, nodeId?: string) => {
    set({
      knowledgePointModalShow: isShow,
      knowledgePointNodeId: nodeId || "",
    });
  },

  toggleKnowledgeDrawer: (isShow: boolean, nodeId?: string) => {
    set({ knowledgeDrawerShow: isShow, knowledgeDrawerNodeId: nodeId || "" });
  },

  addKnowledgePoint: (nodeId: string, point: KnowledgePoint) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound) {
      if (!nodeFound.knowledgePoints) nodeFound.knowledgePoints = [];
      nodeFound.knowledgePoints.push(point);
      set({ mindmap: newMindmap });
    }
    state.saveSnapshot();
  },

  updateKnowledgePoint: (
    nodeId: string,
    pointId: string,
    point: Partial<KnowledgePoint>,
  ) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound && nodeFound.knowledgePoints) {
      const pointIndex = nodeFound.knowledgePoints.findIndex(
        (p) => p.id === pointId,
      );
      if (pointIndex >= 0) {
        nodeFound.knowledgePoints[pointIndex] = {
          ...nodeFound.knowledgePoints[pointIndex],
          ...point,
        };
        set({ mindmap: newMindmap });
      }
    }
    state.saveSnapshot();
  },

  deleteKnowledgePoint: (nodeId: string, pointId: string) => {
    const state = get();
    const newMindmap = deepCopy(state.mindmap);
    const nodeFound = findNode(newMindmap, nodeId);
    if (nodeFound && nodeFound.knowledgePoints) {
      nodeFound.knowledgePoints = nodeFound.knowledgePoints.filter(
        (p) => p.id !== pointId,
      );
      set({ mindmap: newMindmap });
    }
    state.saveSnapshot();
  },

  toggleEditPanel: (isShow: boolean) => {
    set({ editPanelShow: isShow });
  },

  loadMindmap: (mindmap: MindMapNode) => {
    set({
      mindmap,
      curSelect: mindmap.id,
      history: [],
      redoStack: [],
      lastSnapshot: null,
    });
  },

  getMindmap: () => {
    return get().mindmap;
  },

  getTheme: () => {
    const state = get();
    return state.getThemeList()[state.themeIndex];
  },

  setTheme: (index: number) => {
    set({ themeIndex: index });
    localStorage.setItem("theme_index", String(index));
  },

  getThemeList: () => DEFAULT_THEME_LIST,
}));

export default useMindMapStore;
