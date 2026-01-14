"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiResponse, ApiError } from "@/lib/api";

export interface UseApiOptions<T> {
  immediate?: boolean; // Whether to fetch immediately on mount
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  transform?: (data: unknown) => T; // Transform response data
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for API calls
 * @param endpoint - API endpoint (e.g., '/api/dropdown/complexions')
 * @param options - Configuration options
 * @returns Object with data, loading, error, execute function, and reset function
 */
export function useApi<T = unknown>(
  endpoint: string | null,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError, transform } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate && !!endpoint);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint);

      if (response.success && response.data !== undefined) {
        const transformedData = transform
          ? transform(response.data)
          : (response.data as T);
        setData(transformedData);
        onSuccess?.(transformedData);
      } else {
        throw {
          message: response.message || "Failed to fetch data",
          error: response.error,
        } as ApiError;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
    } finally {
      setLoading(false);
    }
  }, [endpoint, transform, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate && endpoint) {
      execute();
    }
  }, [immediate, endpoint, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for POST, PUT, DELETE, PATCH requests
 */
export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
  transform?: (data: unknown) => TData;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (
    variables: TVariables,
    method?: "POST" | "PUT" | "DELETE" | "PATCH"
  ) => Promise<void>;
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const { onSuccess, onError, transform } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (
      variables: TVariables,
      method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST"
    ) => {
      setLoading(true);
      setError(null);

      try {
        let response: ApiResponse<TData>;

        switch (method) {
          case "POST":
            response = await api.post<TData>(endpoint, variables);
            break;
          case "PUT":
            response = await api.put<TData>(endpoint, variables);
            break;
          case "DELETE":
            response = await api.delete<TData>(endpoint);
            break;
          case "PATCH":
            response = await api.patch<TData>(endpoint, variables);
            break;
          default:
            response = await api.post<TData>(endpoint, variables);
        }

        if (response.success && response.data !== undefined) {
          const transformedData = transform
            ? transform(response.data)
            : (response.data as TData);
          setData(transformedData);
          onSuccess?.(transformedData);
        } else {
          throw {
            message: response.message || "Request failed",
            error: response.error,
          } as ApiError;
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        onError?.(apiError);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, transform, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}
