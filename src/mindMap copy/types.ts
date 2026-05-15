import { v4 as uuidv4 } from "uuid";

// 知识点
export type KnowledgePoint = {
  id: string;
  title: string;
  content: string;
};

// 思维导图节点类型
export interface MindMapNode {
  id: string;
  text: string;
  showChildren: boolean;
  children: MindMapNode[];
  info?: string;
  parent_id?: string;
  knowledgePoints: KnowledgePoint[];
}

// 节点状态信息（包含 parent 上下文）
export interface NodeInfo {
  id: string;
  text: string;
  showChildren: boolean;
  children: MindMapNode[];
  info?: string;
  parentId?: string;
  knowledgePoints: KnowledgePoint[];
  parent: MindMapNode | { id: string; children: MindMapNode[] };
  on_left: boolean;
  parent_id: string;
}

// 节点选中/编辑状态
export interface NodeStatus {
  cur_select: string;
  select_by_click: boolean;
  cur_edit: string;
  cur_node_info: NodeInfo;
}

// 主题
export interface Theme {
  main: string;
  light: string;
  dark: string;
  ex: string;
  assist: string;
}

// 历史快照
export interface HistorySnapshot {
  mindmap: string;
  cur_node: string;
}

// 默认主题列表
export const DEFAULT_THEME_LIST: Theme[] = [
  {
    main: "#2d99d7",
    light: "#e2f5ff",
    dark: "#2786c3",
    ex: "#2375af",
    assist: "#ca6c27",
  },
  {
    main: "#eda938",
    light: "#f4cc87",
    dark: "#e79021",
    ex: "#ce7529",
    assist: "#1980da",
  },
  {
    main: "#ff4c26",
    light: "#ffcabc",
    dark: "#e83f1d",
    ex: "#c12a0f",
    assist: "#0e95ac",
  },
  {
    main: "#50b843",
    light: "#c3e5bd",
    dark: "#28ab17",
    ex: "#038b00",
    assist: "#790595",
  },
  {
    main: "#b347d2",
    light: "#e4c0ef",
    dark: "#a623c9",
    ex: "#9621c3",
    assist: "#009000",
  },
  {
    main: "#555555",
    light: "#e9e9e9",
    dark: "#434343",
    ex: "#262626",
    assist: "#860314",
  },
];

// 常量
export const ROOT_NODE_ID = uuidv4();
export const ROOT_PARENT = {
  id: "",
  children: [] as MindMapNode[],
  parent_id: "",
};
export const NEW_NODE_TEXT = "新建节点";

// 节点类型标签
export const LEFT_NODE = "nodeLeft";
export const RIGHT_NODE = "nodeRight";
export const DROP_AREA = "dropArea";
