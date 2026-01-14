'use client';

import { useApi } from './useApi';

export interface DropdownOption {
  value: number;
  label: string;
  isActive?: boolean;
}

/**
 * Hook specifically for fetching dropdown data
 * Automatically transforms the API response to match the expected format
 */
export function useDropdown(endpoint: string, immediate: boolean = true) {
  return useApi<DropdownOption[]>(endpoint, {
    immediate,
    transform: (data: DropdownOption[]) => {
      // Ensure data is an array and filter active items
      if (Array.isArray(data)) {
        return data.filter((item) => item.isActive !== false);
      }
      return [];
    },
  });
}

// Pre-configured hooks for common dropdowns
export function useComplexions(immediate: boolean = true) {
  return useDropdown('/api/dropdown/complexions', immediate);
}

export function useReligions(immediate: boolean = true) {
  return useDropdown('/api/dropdown/religions', immediate);
}

export function useCastes(immediate: boolean = true) {
  return useDropdown('/api/dropdown/castes', immediate);
}

export function useGotras(immediate: boolean = true) {
  return useDropdown('/api/dropdown/gotras', immediate);
}

export function useHeights(immediate: boolean = true) {
  return useDropdown('/api/dropdown/heights', immediate);
}

export function useMaritalStatuses(immediate: boolean = true) {
  return useDropdown('/api/dropdown/marital-statuses', immediate);
}

export function useMotherTongues(immediate: boolean = true) {
  return useDropdown('/api/dropdown/mother-tongues', immediate);
}

export function useQualifications(immediate: boolean = true) {
  return useDropdown('/api/dropdown/qualifications', immediate);
}

export function useFoodPreferences(immediate: boolean = true) {
  return useDropdown('/api/dropdown/food-preferences', immediate);
}

export function useStates(immediate: boolean = true) {
  return useDropdown('/api/dropdown/states', immediate);
}

export function useCities(immediate: boolean = true) {
  return useDropdown('/api/dropdown/cities', immediate);
}
