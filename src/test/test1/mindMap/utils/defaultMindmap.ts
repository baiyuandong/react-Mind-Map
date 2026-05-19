import { MindMapNode, ROOT_NODE_ID } from "../types";

const defaultMindmap: MindMapNode = {
  id: ROOT_NODE_ID,
  name: "主题",
  showChildren: true,
  parent_id: "0",
  points: [],
  children: [],
};

export default defaultMindmap;
