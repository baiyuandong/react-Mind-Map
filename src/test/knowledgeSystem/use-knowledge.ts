import type {
  CreateSystemRequest,
  CreateSystemResponse,
  SystemListResponse,
  UpdateSystemRequest,
  UpdateSystemResponse,
  DeleteSystemResponse,
  KnowledgeTreeResponse,
  NodeCrudRequest,
  NodeCrudResponse,
  SystemMembersResponse,
  UpdateSystemPermissionRequest,
  UpdateSystemPermissionResponse,
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
