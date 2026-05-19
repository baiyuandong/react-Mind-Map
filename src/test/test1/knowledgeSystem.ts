// ─── API Response Wrapper ──────────────────────────────

export type KnowledgeApiResponse<T> = {
  code: number
  msg: string
  data: T
}

// ─── 1. Create System ──────────────────────────────────

export type CreateSystemRequest = {
  name: string
  sort: string
  describe?: string
  permission?: 'only_me' | 'all_team_members' | 'partial_members'
  partial_member_list?: { user_id: string }[]
}

export type CreateSystemData = {
  id: string
}

export type CreateSystemResponse = KnowledgeApiResponse<CreateSystemData>

// ─── 2. Get System List ────────────────────────────────

export type SystemItem = {
  id: string
  name: string
  describe: string
  sort: string
  permission: 'only_me' | 'all_team_members' | 'partial_members'
  create_by: string
  update_by: string
  create_by_name: string
  update_by_name: string
  create_at: string
  update_at: string
  partial_member_list: string[]
}

export type SystemListData = SystemItem[]

export type SystemListResponse = KnowledgeApiResponse<SystemListData>

// Paginated variant
export type PaginatedSystemListData = {
  items: SystemItem[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export type PaginatedSystemListResponse = KnowledgeApiResponse<PaginatedSystemListData>

// ─── 3. Update System ──────────────────────────────────

export type UpdateSystemRequest = {
  name?: string
  sort?: string
  describe?: string
  permission?: 'only_me' | 'all_team_members' | 'partial_members'
  partial_member_list?: { user_id: string }[]
}

export type UpdateSystemData = {
  id: string
}

export type UpdateSystemResponse = KnowledgeApiResponse<UpdateSystemData>

// ─── 4. Delete System ──────────────────────────────────

export type DeleteSystemResponse = KnowledgeApiResponse<null>

// ─── 5. Get Knowledge Tree ─────────────────────────────

export type PointBinding = {
  binding_id: string
  point_id: string
  name: string
  description: string
  position: number
  update_at: string
}

export type TreeNode = {
  id: string
  name: string
  describe: string
  parent_id: string | null
  points: PointBinding[]
  children: TreeNode[]
}

export type KnowledgeTreeData = TreeNode[]

export type KnowledgeTreeResponse = KnowledgeApiResponse<KnowledgeTreeData>

// ─── 6. Node CRUD ──────────────────────────────────────

export type NodeCrudIncrementalData =
  | {
      action: 'create'
      id: string
      parent_id: string | null
      name: string
    }
  | {
      action: 'update'
      id: string
      name?: string
      describe?: string
    }
  | {
      action: 'move'
      id: string
      parent_id: string | null
    }
  | {
      action: 'batch_move'
      node_ids: string[]
      parent_id: string
    }
  | {
      action: 'sort'
      node_ids: string[]
    }
  | {
      action: 'delete'
      id: string
    }

export type NodeCrudRequest = {
  full_data: TreeNode[]
  incremental_data: NodeCrudIncrementalData
}

export type NodeCrudResponse = KnowledgeApiResponse<null>

// ─── 7. Get System Members ─────────────────────────────

export type SystemMembersData = {
  permission: 'only_me' | 'all_team_members' | 'partial_members'
  partial_member_list: string[]
}

export type SystemMembersResponse = KnowledgeApiResponse<SystemMembersData>

// ─── 8. Update System Permission ───────────────────────

export type UpdateSystemPermissionRequest = {
  permission: 'only_me' | 'all_team_members' | 'partial_members'
  partial_member_list?: { user_id: string }[]
}

export type UpdateSystemPermissionResponse = KnowledgeApiResponse<null>

// ─── 9. Create Single Point ─────────────────────────────

export type CreateSinglePointRequest = {
  name: string
  description?: string
}

export type CreateSinglePointData = {
  binding_id: string
  point_id: string
  name: string
  description: string
  position: number
}

export type CreateSinglePointResponse = KnowledgeApiResponse<CreateSinglePointData>

// ─── 10. Batch Create Points ────────────────────────────

export type BatchCreatePointsRequest = {
  text: string
}

export type BatchCreatePointsData = {
  success_count: number
  error_count: number
  error_details: string[]
}

export type BatchCreatePointsResponse = KnowledgeApiResponse<BatchCreatePointsData>

// ─── 11. Get Node Points ────────────────────────────────

export type NodePointItem = {
  binding_id: string
  point_id: string
  name: string
  description: string
  position: number
  create_at: string
  update_at: string
}

export type GetNodePointsResponse = KnowledgeApiResponse<NodePointItem[]>

// ─── 12. Update Point Binding ───────────────────────────

export type UpdatePointBindingRequest = {
  name?: string
  description?: string
}

export type UpdatePointBindingResponse = KnowledgeApiResponse<null>

// ─── 13. Delete Point Binding ───────────────────────────

export type DeletePointBindingResponse = KnowledgeApiResponse<null>

