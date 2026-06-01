import { api } from "./http";
import type { Farm, FarmFormValues, FarmListResponse, FarmQuery } from "../types/farm";

type RawFarmListResponse = {
  success: boolean;
  message: string;
  data: Farm[];
  pagination?: {
    page?: number;
    currentPage?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const mapFormValues = (values: FarmFormValues) => ({
  ...values,
  landSize: Number(values.landSize),
  latitude: values.latitude ? Number(values.latitude) : undefined,
  longitude: values.longitude ? Number(values.longitude) : undefined,
});

const toQueryString = (query: FarmQuery) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export const farmApi = {
  listMine: async (query: FarmQuery = {}) => {
    const response = await api.get<RawFarmListResponse>(`/farms${toQueryString(query)}`);
    const pagination = response.data.pagination;

    return {
      farms: response.data.data || [],
      meta: {
        page: pagination?.page ?? pagination?.currentPage ?? query.page ?? 1,
        limit: pagination?.limit ?? query.limit ?? 10,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 1,
      },
    } satisfies FarmListResponse;
  },
  listAll: async (query: FarmQuery = {}) => {
    const response = await api.get<RawFarmListResponse>(`/farms${toQueryString(query)}`);
    const pagination = response.data.pagination;

    return {
      farms: response.data.data || [],
      meta: {
        page: pagination?.page ?? pagination?.currentPage ?? query.page ?? 1,
        limit: pagination?.limit ?? query.limit ?? 10,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 1,
      },
    } satisfies FarmListResponse;
  },
  getById: async (farmId: string) => {
    const response = await api.get<{ data: Farm }>(`/farms/${farmId}`);
    return response.data.data;
  },
  create: async (values: FarmFormValues) => {
    const response = await api.post<{ data: Farm }>("/farms", mapFormValues(values));
    return response.data.data;
  },
  update: async (farmId: string, values: FarmFormValues) => {
    const response = await api.patch<{ data: Farm }>(`/farms/${farmId}`, mapFormValues(values));
    return response.data.data;
  },
  remove: async (farmId: string) => {
    await api.delete(`/farms/${farmId}`);
  },
};
