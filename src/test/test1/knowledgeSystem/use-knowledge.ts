import type {
  CreateSystemRequest,
  CreateSystemResponse,
  SystemListResponse,
  PaginatedSystemListResponse,
  UpdateSystemRequest,
  UpdateSystemResponse,
  DeleteSystemResponse,
  KnowledgeTreeResponse,
  NodeCrudRequest,
  NodeCrudResponse,
  SystemMembersResponse,
  UpdateSystemPermissionRequest,
  UpdateSystemPermissionResponse,
  CreateSinglePointRequest,
  CreateSinglePointResponse,
  BatchCreatePointsRequest,
  BatchCreatePointsResponse,
  GetNodePointsResponse,
  UpdatePointBindingRequest,
  UpdatePointBindingResponse,
  DeletePointBindingResponse,
} from "@/models/knowledgeSystem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, patch, post } from "../base";
import { useInvalid } from "../use-base";

const NAME_SPACE = "knowledge";

const SystemsListKey = [NAME_SPACE, "systems"];

// ─── 辅助函数 ───────────────────────────────────────────

const buildUrl = (tenantId: string) => `/v1/knowledge/tenant/${tenantId}`;

// ─── 1. 创建系统 ──────────────────────────────────

export const useCreateSystem = () => {
  return useMutation({
    mutationKey: [...SystemsListKey, "createSystem"],
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateSystemRequest;
    }) =>
      post<CreateSystemResponse>(`${buildUrl(tenantId)}/create_system`, {
        body: data,
      }),
  });
};

// ─── 2. 获取知识体系列表 ────────────────────────────────

export const useSystemList = (tenantId?: string) => {
  return useQuery<SystemListResponse>({
    queryKey: [...SystemsListKey, tenantId],
    queryFn: () =>
      get<SystemListResponse>(`${buildUrl(tenantId!)}/get_systems`),
    enabled: !!tenantId,
  });
};

export const useInvalidSystemList = () => {
  return useInvalid(SystemsListKey);
};

/** Paginated version – supports scrolling load */
export type SystemListParams = {
  page?: number
  page_size?: number
}

export function useSystemListPaginated(
  tenantId?: string,
  params?: SystemListParams,
) {
  const page = params?.page ?? 1
  const pageSize = params?.page_size ?? 20

  return useQuery<PaginatedSystemListResponse>({
    queryKey: [...SystemsListKey, 'paginated', tenantId, page, pageSize],
    queryFn: () =>
      get<PaginatedSystemListResponse>(
        `${buildUrl(tenantId!)}/get_systems`,
        { params: { page, page_size: pageSize } },
      ),
    enabled: !!tenantId,
  });
}

// ─── 3. 更新系统 ──────────────────────────────────

export const useUpdateSystem = () => {
  return useMutation({
    mutationKey: [...SystemsListKey, "updateSystem"],
    mutationFn: ({
      tenantId,
      systemId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      data: UpdateSystemRequest;
    }) =>
      patch<UpdateSystemResponse>(
        `${buildUrl(tenantId)}/update_system/${systemId}`,
        { body: data },
      ),
  });
};

// ─── 4. 删除系统 ──────────────────────────────────

export const useDeleteSystem = () => {
  return useMutation({
    mutationKey: [...SystemsListKey, "deleteSystem"],
    mutationFn: ({
      tenantId,
      systemId,
    }: {
      tenantId: string;
      systemId: string;
    }) =>
      del<DeleteSystemResponse>(
        `${buildUrl(tenantId)}/delete_system/${systemId}`,
      ),
  });
};

// ─── 5. 获取知识树 ─────────────────────────────

const SystemTreeKey = [NAME_SPACE, "tree"];

export const useKnowledgeTree = ({
  tenantId,
  systemId,
  enabled,
}: {
  tenantId: string;
  systemId: string;
  enabled?: boolean;
}) => {
  return useQuery<KnowledgeTreeResponse>({
    queryKey: [...SystemTreeKey, tenantId, systemId],
    queryFn: () =>
      get<KnowledgeTreeResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/tree`,
      ),
    enabled: enabled ?? (!!tenantId && !!systemId),
  });
};

export const useInvalidKnowledgeTree = (tenantId: string, systemId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: [...SystemTreeKey, tenantId, systemId],
    });
  };
};

// ─── 6. 节点 CRUD (同步) ───────────────────────────────

export const useNodeCrud = () => {
  return useMutation({
    mutationKey: [...NAME_SPACE, "nodeCrud"],
    mutationFn: async ({
      tenantId,
      systemId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      data: NodeCrudRequest | NodeCrudRequest[];
    }) => {
      if (!tenantId || !systemId)
        throw new Error("tenantId and systemId required");

      const items = Array.isArray(data) ? data : [data];

      const payload = items.map((item) => {
        const action = (item as any).action || "update";
        if (action === "move") {
          return {
            action: "move",
            id: (item as any).id,
            parent_id: (item as any).parent_id,
          } as any;
        }
        // create / update: send fuller node
        return {
          ...item,
        } as any;
      });

      return post<NodeCrudResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/crud`,
        {
          body: payload.length === 1 ? payload[0] : payload,
        },
      );
    },
  });
};

// ─── 6.a 辅助：将 incremental_data 映射并同步到后台（可直接从组件调用） ─────────────────
export async function syncIncrementalNodes(
  tenantId: string,
  systemId: string,
  data?: Map<string, any>,
): Promise<NodeCrudResponse | null> {
  if (!tenantId || !systemId) throw new Error("tenantId and systemId required");
  const incrementalData = data?.incremental_data as any[];
  if (!incrementalData || incrementalData.length === 0) return null;

  const payload = incrementalData.map((item) => {
    const action = item.action || "update";
    if (action === "move") {
      return {
        action: "move",
        id: item.id,
        parent_id: item.parent_id,
      } as any;
    }

    // create/update -> return fuller node object
    return {
      action,
      id: item.id,
      parent_id: item.parent_id,
      name: item.name,
      describe: item.describe,
      knowledgePoints: item.knowledgePoints || [],
    } as any;
  });
  data.incremental_data = payload;
  data.full_data = [];

  return post<NodeCrudResponse>(
    `${buildUrl(tenantId)}/system/${systemId}/crud`,
    {
      body: data as any,
    },
  );
}

// ─── 7. 获取系统成员 ─────────────────────────────

const SystemMembersKey = [NAME_SPACE, "members"];

export const useSystemMembers = ({
  tenantId,
  systemId,
  enabled,
}: {
  tenantId: string;
  systemId: string;
  enabled?: boolean;
}) => {
  return useQuery<SystemMembersResponse>({
    queryKey: [...SystemMembersKey, tenantId, systemId],
    queryFn: () =>
      get<SystemMembersResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/members`,
      ),
    enabled: enabled ?? (!!tenantId && !!systemId),
  });
};

// ─── 8. 更新系统权限 ───────────────────────

export const useUpdateSystemPermission = () => {
  return useMutation({
    mutationKey: [...SystemsListKey, "updatePermission"],
    mutationFn: ({
      tenantId,
      systemId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      data: UpdateSystemPermissionRequest;
    }) =>
      patch<UpdateSystemPermissionResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/permission`,
        { body: data },
      ),
  });
};

// ─── 9. 添加单个知识点 ─────────────────────────

const NodePointsKey = [NAME_SPACE, "nodePoints"];

export const useCreateSinglePoint = () => {
  return useMutation({
    mutationKey: [...NodePointsKey, "createSingle"],
    mutationFn: ({
      tenantId,
      systemId,
      nodeId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      nodeId: string;
      data: CreateSinglePointRequest;
    }) =>
      post<CreateSinglePointResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/node/${nodeId}/points/single`,
        { body: data },
      ),
  });
};

// ─── 10. 批量添加知识点 ─────────────────────────

export const useBatchCreatePoints = () => {
  return useMutation({
    mutationKey: [...NodePointsKey, "batchCreate"],
    mutationFn: ({
      tenantId,
      systemId,
      nodeId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      nodeId: string;
      data: BatchCreatePointsRequest;
    }) =>
      post<BatchCreatePointsResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/node/${nodeId}/points/batch`,
        { body: data },
      ),
  });
};

// ─── 11. 获取节点下的知识点列表 ─────────────────────

export const useNodePoints = ({
  tenantId,
  systemId,
  nodeId,
  enabled,
}: {
  tenantId: string;
  systemId: string;
  nodeId: string;
  enabled?: boolean;
}) => {
  return useQuery<GetNodePointsResponse>({
    queryKey: [...NodePointsKey, tenantId, systemId, nodeId],
    queryFn: () =>
      get<GetNodePointsResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/node/${nodeId}/points`,
      ),
    enabled: enabled ?? (!!tenantId && !!systemId && !!nodeId),
  });
};

export const useUpdatePointBinding = () => {
  return useMutation({
    mutationKey: [...NodePointsKey, "updateBinding"],
    mutationFn: ({
      tenantId,
      systemId,
      bindingId,
      data,
    }: {
      tenantId: string;
      systemId: string;
      bindingId: string;
      data: UpdatePointBindingRequest;
    }) =>
      patch<UpdatePointBindingResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/points/${bindingId}`,
        { body: data },
      ),
  });
};

// ─── 13. 从节点中解绑知识点 ───────────────────────

export const useDeletePointBinding = () => {
  return useMutation({
    mutationKey: [...NodePointsKey, "deleteBinding"],
    mutationFn: ({
      tenantId,
      systemId,
      bindingId,
    }: {
      tenantId: string;
      systemId: string;
      bindingId: string;
    }) =>
      del<DeletePointBindingResponse>(
        `${buildUrl(tenantId)}/system/${systemId}/points/${bindingId}`,
      ),
  });
};
