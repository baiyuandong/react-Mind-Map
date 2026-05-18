import { del, get, patch, post, put } from "@/service/base";

type RelatedAppResponse = {
  data: Array<any>;
  total: number;
};
export const fetchDatasetRelatedApps = (
  params: Record<string, any>,
): Promise<RelatedAppResponse> => {
  return get<RelatedAppResponse>(`/apps`, { params });
};
