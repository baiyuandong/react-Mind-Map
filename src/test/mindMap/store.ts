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
function createNewNode(
  newNodeId: string,
  parentId: string | null,
): MindMapNode {
  return {
    id: newNodeId,
    name: NEW_NODE_TEXT,
    showChildren: true,
    children: [],
    parent_id: parentId,
    knowledgePoints: [],
  };
}

// ===== Store 接口 =====
export interface MindMapStore {
  mindmap: MindMapNode;
  incremental_data?: Array<
    | (MindMapNode & { action?: "create" | "update" })
    | { id: string; parent_id: string; action: "move" }
    | { id: string; action: "delete" }
  >;
  curSelect: string;
  selectByClick: boolean;
  curEdit: string;
  curNodeInfo: {
    id: string;
    name: string;
    showChildren: boolean;
    children: MindMapNode[];
    describe?: string;
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
  handleMoveIncremental?: (nodeId: string, newParentId: string) => void;
  addChild: (nodeId: string) => void;
  addSibling: (nodeId: string, parentId: string) => void;
  moveNode: (
    nodeId: string,
    targetId: string,
    parentId: string,
    isSibling: boolean,
  ) => void;
  changeText: (nodeId: string, name: string) => void;
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
  name: "",
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

const useMindMapStore = create<MindMapStore>((set, get) => {
  return {
    mindmap: loadInitialMindmap(),
    incremental_data: [],
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
        const parentId = nodeFound.parent_id == "0" ? null : nodeId;
        const newNode = createNewNode(newNodeId, parentId);
        nodeFound.children.push(newNode);
        set({
          mindmap: newMindmap,
          curSelect: "",
          curEdit: newNodeId,
          curNodeInfo: initialNodeInfo,
          incremental_data: [
            ...(state.incremental_data || []),
            { ...newNode, action: "create" },
          ],
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
          const newNode = createNewNode(newNodeId, parentId);
          nodeFound.children.splice(insertIndex, 0, newNode);
          set({
            mindmap: newMindmap,
            curSelect: "",
            curEdit: newNodeId,
            curNodeInfo: initialNodeInfo,
            incremental_data: [
              ...(state.incremental_data || []),
              { ...newNode, action: "create" },
            ],
          });
        }
      }
      state.saveSnapshot();
    },

    //  更新移动操作的增量数据
    handleMoveIncremental: (nodeId: string, newParentId: string) => {
      const state = get();
      const list = state.incremental_data || [];
      const idx = list.findIndex((n) => n.id === nodeId);

      if (idx >= 0) {
        const item = list[idx] as
          | (MindMapNode & { action?: "create" | "update" })
          | { id: string; parent_id: string; action: "move" };

        // 如果该项是新创建的节点或者已经是移动记录，则更新“父节点ID”字段。
        if (item.action === "create" || item.action === "move") {
          const newList = [...list];
          newList[idx] = { ...item, parent_id: newParentId } as any;
          set({ incremental_data: newList });
          return;
        }

        // item.action === 'update' 原始数据已更改 -> 尝试查找已有的移动记录条目
        const moveIdx = list.findIndex(
          (n) => n.id === nodeId && (n as any).action === "move",
        );
        if (moveIdx >= 0) {
          const newList = [...list];
          newList[moveIdx] = {
            ...newList[moveIdx],
            parent_id: newParentId,
          } as any;
          set({ incremental_data: newList });
          return;
        }

        // 否则追加一个仅移动的条目
        set({
          incremental_data: [
            ...list,
            { id: nodeId, parent_id: newParentId, action: "move" },
          ],
        });
        return;
      }

      // 没有现有条目 => 添加仅移动的条目
      set({
        incremental_data: [
          ...list,
          { id: nodeId, parent_id: newParentId, action: "move" },
        ],
      });
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
        const nodeIndex = parent.children.findIndex(
          (node) => node.id === nodeId,
        );
        if (nodeIndex >= 0) {
          const [nodeCopy] = parent.children.splice(nodeIndex, 1);
          let newParentId = parentId;
          if (isSibling) {
            const targetIndex = parent.children.findIndex(
              (node) => node.id === targetId,
            );
            // 同级移动：新父节点仍为 parentId
            nodeCopy.parent_id = parentId;
            const insertAt =
              targetIndex >= 0 ? targetIndex + 1 : parent.children.length;
            parent.children.splice(insertAt, 0, nodeCopy);
            newParentId = parentId;
          } else {
            const targetNode = findNode(newMindmap, targetId);
            if (targetNode) {
              // 作为子节点移动：更新 parent_id 为目标节点 id
              nodeCopy.parent_id = targetNode.id;
              targetNode.children.push(nodeCopy);
              newParentId = targetNode.id;
            }
          }
          set({
            mindmap: newMindmap,
            curSelect: nodeId,
            curNodeInfo: initialNodeInfo,
          });

          // 更新 incremental_data（专用方法）
          try {
            const runner = get();
            if (runner && typeof runner.handleMoveIncremental === "function") {
              runner.handleMoveIncremental(nodeId, newParentId);
            }
          } catch (e) {
            // ignore
          }
        }
      }
      state.saveSnapshot();
    },

    changeText: (nodeId: string, name: string) => {
      const state = get();
      const newMindmap = deepCopy(state.mindmap);
      const nodeFound = findNode(newMindmap, nodeId);
      if (nodeFound) {
        nodeFound.name = name;

        // 更新 incremental_data：如果已存在且为 create，则更新该条；否则插入/更新为 action: 'update'
        const existingList = state.incremental_data || [];
        const existIndex = existingList.findIndex((n) => n.id === nodeId);
        if (existIndex >= 0) {
          const existItem = existingList[existIndex] as any;
          if (existItem.action === "create") {
            const newList = [...existingList];
            newList[existIndex] = { ...existItem, name } as any;
            set({ mindmap: newMindmap, incremental_data: newList });
          } else if (existItem.action === "update") {
            const newList = [...existingList];
            // ensure full node shape for update entry
            newList[existIndex] = {
              ...existItem,
              name,
              action: "update",
            } as any;
            set({ mindmap: newMindmap, incremental_data: newList });
          } else if (existItem.action === "move") {
            // 存在仅包含移动操作的条目，需添加一个完整的更新条目。
            set({
              mindmap: newMindmap,
              incremental_data: [
                ...existingList,
                { ...nodeFound, name, action: "update" } as any,
              ],
            });
          } else {
            // 追加更新条目
            set({
              mindmap: newMindmap,
              incremental_data: [
                ...existingList,
                { ...nodeFound, name, action: "update" } as any,
              ],
            });
          }
        } else {
          set({
            mindmap: newMindmap,
            incremental_data: [
              ...existingList,
              { ...nodeFound, name, action: "update" } as any,
            ],
          });
        }
      }
      state.saveSnapshot();
    },

    editNodeInfo: (nodeId: string, info: string) => {
      const state = get();
      const newMindmap = deepCopy(state.mindmap);
      const nodeFound = findNode(newMindmap, nodeId);
      if (nodeFound) {
        nodeFound.describe = info;

        // 同样更新 incremental_data
        const existingList = state.incremental_data || [];
        const existIndex = existingList.findIndex((n) => n.id === nodeId);
        if (existIndex >= 0) {
          const existItem = existingList[existIndex] as any;
          if (existItem.action === "create") {
            const newList = [...existingList];
            newList[existIndex] = { ...existItem, info } as any;
            set({ mindmap: newMindmap, incremental_data: newList });
          } else if (existItem.action === "update") {
            const newList = [...existingList];
            newList[existIndex] = {
              ...existItem,
              info,
              action: "update",
            } as any;
            set({ mindmap: newMindmap, incremental_data: newList });
          } else if (existItem.action === "move") {
            set({
              mindmap: newMindmap,
              incremental_data: [
                ...existingList,
                { ...nodeFound, info, action: "update" } as any,
              ],
            });
          } else {
            set({
              mindmap: newMindmap,
              incremental_data: [
                ...existingList,
                { ...nodeFound, info, action: "update" } as any,
              ],
            });
          }
        } else {
          set({
            mindmap: newMindmap,
            incremental_data: [
              ...existingList,
              { ...nodeFound, info, action: "update" } as any,
            ],
          });
        }
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
            name: node.name,
            showChildren: node.showChildren,
            children: node.children,
            describe: node.describe,
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

            // 处理 incremental_data：
            const existingList = state.incremental_data || [];
            const existIndex = existingList.findIndex((n) => n.id === nodeId);
            let newIncremental = [...existingList];

            if (existIndex >= 0) {
              const existItem = newIncremental[existIndex] as any;
              if (existItem.action === "create") {
                // 如果该节点是新创建的（尚未同步），删除该 create 条目即可，不再追加 delete
                newIncremental = newIncremental.filter((n) => n.id !== nodeId);
              } else if (existItem.action === "delete") {
                // 已经标记为删除，保持不变
              } else {
                // 对于 update / move 等，替换为 delete 条目
                newIncremental[existIndex] = {
                  id: nodeId,
                  action: "delete",
                } as any;
              }
            } else {
              // 不存在则追加 delete 条目（只需 id 即可）
              newIncremental.push({ id: nodeId, action: "delete" } as any);
            }

            set({
              mindmap: newMindmap,
              curSelect: parentId,
              curNodeInfo: initialNodeInfo,
              incremental_data: newIncremental,
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
  };
});

export default useMindMapStore;
