import { useCallback } from "react";
import { toast } from "@/app/components/base/ui/toast";
import {
  useCreateSinglePoint,
  useUpdatePointBinding,
  useDeletePointBinding,
} from "@/service/knowledgeSystem/use-knowledge";
import useMindMapStore from "../store";
import type { Points } from "../types";

/**
 * 将 knowledgePoint CRUD 的 API 调用、store 状态同步和错误处理内聚在一起。
 *
 * @param tenantId - 当前租户 ID
 * @param systemId - 当前知识体系 ID
 * @param nodeId   - 当前 Drawer 对应的思维导图节点 ID
 */
export function useKnowledgePointDrawer(
  tenantId: string,
  systemId: string,
  nodeId: string,
) {
  const createSinglePointMutation = useCreateSinglePoint();
  const updatePointBindingMutation = useUpdatePointBinding();
  const deletePointBindingMutation = useDeletePointBinding();

  const addKnowledgePoint = useMindMapStore((s) => s.addKnowledgePoint);
  const updateKnowledgePoint = useMindMapStore((s) => s.updateKnowledgePoint);
  const deleteKnowledgePoint = useMindMapStore((s) => s.deleteKnowledgePoint);

  const handleAdd = useCallback(
    async (point: Omit<Points, "id">) => {
      try {
        const res = await createSinglePointMutation.mutateAsync({
          tenantId,
          systemId,
          nodeId,
          data: {
            name: point.name,
            description: point.description || "",
          },
        });
        addKnowledgePoint(nodeId, {
          id: res.data?.binding_id ?? crypto.randomUUID(),
          name: point.name,
          description: point.description || "",
        });
      } catch (err: any) {
        toast.error(err?.data || "添加失败");
      }
    },
    [tenantId, systemId, nodeId, createSinglePointMutation, addKnowledgePoint],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deletePointBindingMutation.mutateAsync({
          tenantId,
          systemId,
          bindingId: id,
        });
        deleteKnowledgePoint(nodeId, id);
      } catch (err: any) {
        toast.error(err?.data || "删除失败");
      }
    },
    [
      tenantId,
      systemId,
      nodeId,
      deletePointBindingMutation,
      deleteKnowledgePoint,
    ],
  );

  const handleEdit = useCallback(
    async (point: Points) => {
      try {
        await updatePointBindingMutation.mutateAsync({
          tenantId,
          systemId,
          bindingId: point.id,
          data: {
            name: point.name,
            description: point.description,
          },
        });
        updateKnowledgePoint(nodeId, point.id, {
          name: point.name,
          description: point.description,
        });
      } catch (err: any) {
        toast.error(err?.data || "更新失败");
      }
    },
    [
      tenantId,
      systemId,
      nodeId,
      updatePointBindingMutation,
      updateKnowledgePoint,
    ],
  );

  return { handleAdd, handleDelete, handleEdit };
}
