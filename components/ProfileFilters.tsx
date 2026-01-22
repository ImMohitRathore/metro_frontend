'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import CustomFormField from './CustomFormField';

interface DropdownOption {
  _id: string;
  value: number;
  label: string;
  isActive: boolean;
}

interface ProfileFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearchChange: (search: string) => void;
  searchQuery: string;
}

export interface FilterState {
  gender?: number;
  minAge?: number;
  maxAge?: number;
  height?: number;
  maritalStatus?: number;
  religion?: number;
  caste?: number;
  qualification?: number;
  city?: number;
  state?: number;
  foodPreference?: number;
  occupation?: string;
  annualIncome?: string;
}

export default function ProfileFilters({
  filters,
  onFiltersChange,
  onSearchChange,
  searchQuery,
}: ProfileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState<{
    genders: DropdownOption[];
    religions: DropdownOption[];
    castes: DropdownOption[];
    maritalStatuses: DropdownOption[];
    heights: DropdownOption[];
    qualifications: DropdownOption[];
    states: DropdownOption[];
    cities: DropdownOption[];
    diets: DropdownOption[];
  }>({
    genders: [],
    religions: [],
    castes: [],
    maritalStatuses: [],
    heights: [],
    qualifications: [],
    states: [],
    cities: [],
    diets: [],
  });
  const [loading, setLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (filters.state) {
      fetchCitiesByState(filters.state);
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [filters.state]);

  // Debounce search input - update parent after 500ms of no typing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 500); // 500ms debounce delay

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchQuery, onSearchChange]);

  // Sync local search with parent when it changes externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const [
        gendersRes,
        religionsRes,
        castesRes,
        maritalStatusesRes,
        heightsRes,
        qualificationsRes,
        statesRes,
        dietsRes,
      ] = await Promise.all([
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/genders'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/religions'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/castes'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/marital-statuses'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/heights'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/qualifications'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/states'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/diets'),
      ]);
      // Handle API response structure - check if data is nested or direct
      const getDropdownData = (response: { data?: DropdownOption[] | { data?: DropdownOption[] } }): DropdownOption[] => {
        if (!response || !response.data) return [];
        // Check if response.data has a data property (nested) or is the array directly
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return [];
      };
        
      setDropdowns({
        genders: getDropdownData(gendersRes),
        religions: getDropdownData(religionsRes),
        castes: getDropdownData(castesRes),
        maritalStatuses: getDropdownData(maritalStatusesRes),
        heights: getDropdownData(heightsRes),
        qualifications: getDropdownData(qualificationsRes),
        states: getDropdownData(statesRes),
        cities: [],
        diets: getDropdownData(dietsRes),
      });
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitiesByState = async (stateValue: number) => {
    try {
      const response = await api.get<{ success: boolean; data: DropdownOption[] }>(
        `/api/dropdown/cities?stateId=${stateValue}`
      );
      // Handle API response structure
      let cities: DropdownOption[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          cities = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          cities = response.data.data;
        }
      }
      setDropdowns((prev) => ({ ...prev, cities }));
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '') || searchQuery.trim() !== '';

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <span className="font-medium text-gray-700">
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block bg-white rounded-lg shadow-md p-6 mb-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-rose-600 hover:text-rose-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading filters...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div>
              <CustomFormField
                id="search"
                name="search"
                label="Search by Name, Mobile, or Email"
                type="text"
                value={localSearchQuery}
                placeholder="Enter name, mobile, or email..."
                onChange={(name, value) => setLocalSearchQuery(value as string)}
                onTextChange={(e) => setLocalSearchQuery(e.target.value)}
              />
              {localSearchQuery !== searchQuery && (
                <p className="mt-1 text-xs text-gray-500">Searching...</p>
              )}
            </div>

            {/* Gender */}
            <CustomFormField
              id="gender"
              name="gender"
              label="Gender"
              type="select"
              value={filters.gender || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.genders.map((gender) => ({
                  value: gender.value,
                  label: gender.label,
                })),
              ]}
              placeholder="Select Gender"
              onChange={(name, value) => handleFilterChange('gender', value === '' ? undefined : Number(value))}
            />

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-2">
              <CustomFormField
                id="minAge"
                name="minAge"
                label="Min Age"
                type="number"
                value={filters.minAge || ''}
                placeholder="18"
                onChange={(name, value) => handleFilterChange('minAge', value === '' ? undefined : Number(value))}
                onTextChange={(e) => handleFilterChange('minAge', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <CustomFormField
                id="maxAge"
                name="maxAge"
                label="Max Age"
                type="number"
                value={filters.maxAge || ''}
                placeholder="100"
                onChange={(name, value) => handleFilterChange('maxAge', value === '' ? undefined : Number(value))}
                onTextChange={(e) => handleFilterChange('maxAge', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Height */}
            <CustomFormField
              id="height"
              name="height"
              label="Height"
              type="select"
              value={filters.height || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.heights.map((height) => ({
                  value: height.value,
                  label: height.label,
                })),
              ]}
              placeholder="Select Height"
              onChange={(name, value) => handleFilterChange('height', value === '' ? undefined : Number(value))}
            />

            {/* Marital Status */}
            <CustomFormField
              id="maritalStatus"
              name="maritalStatus"
              label="Marital Status"
              type="select"
              value={filters.maritalStatus || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.maritalStatuses.map((status) => ({
                  value: status.value,
                  label: status.label,
                })),
              ]}
              placeholder="Select Marital Status"
              onChange={(name, value) => handleFilterChange('maritalStatus', value === '' ? undefined : Number(value))}
            />

            {/* Religion */}
            <CustomFormField
              id="religion"
              name="religion"
              label="Religion"
              type="select"
              value={filters.religion || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.religions.map((religion) => ({
                  value: religion.value,
                  label: religion.label,
                })),
              ]}
              placeholder="Select Religion"
              onChange={(name, value) => handleFilterChange('religion', value === '' ? undefined : Number(value))}
            />

            {/* Caste */}
            <CustomFormField
              id="caste"
              name="caste"
              label="Caste"
              type="select"
              value={filters.caste || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.castes.map((caste) => ({
                  value: caste.value,
                  label: caste.label,
                })),
              ]}
              placeholder="Select Caste"
              onChange={(name, value) => handleFilterChange('caste', value === '' ? undefined : Number(value))}
            />

            {/* Qualification */}
            <CustomFormField
              id="qualification"
              name="qualification"
              label="Qualification"
              type="select"
              value={filters.qualification || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.qualifications.map((qual) => ({
                  value: qual.value,
                  label: qual.label,
                })),
              ]}
              placeholder="Select Qualification"
              onChange={(name, value) => handleFilterChange('qualification', value === '' ? undefined : Number(value))}
            />

            {/* State */}
            <CustomFormField
              id="state"
              name="state"
              label="State"
              type="select"
              value={filters.state || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.states.map((state) => ({
                  value: state.value,
                  label: state.label,
                })),
              ]}
              placeholder="Select State"
              onChange={(name, value) => {
                const stateValue = value === '' ? undefined : Number(value);
                handleFilterChange('state', stateValue);
                // Clear city when state changes
                if (!stateValue) {
                  handleFilterChange('city', undefined);
                }
              }}
            />

            {/* City */}
            {filters.state && (
              <CustomFormField
                id="city"
                name="city"
                label="City"
                type="select"
                value={filters.city || ''}
                options={[
                  { value: '', label: 'All' },
                  ...dropdowns.cities.map((city) => ({
                    value: city.value,
                    label: city.label,
                  })),
                ]}
                placeholder="Select City"
                onChange={(name, value) => handleFilterChange('city', value === '' ? undefined : Number(value))}
                disabled={!filters.state || dropdowns.cities.length === 0}
              />
            )}

            {/* Food Preference */}
            <CustomFormField
              id="foodPreference"
              name="foodPreference"
              label="Food Preference"
              type="select"
              value={filters.foodPreference || ''}
              options={[
                { value: '', label: 'All' },
                ...dropdowns.diets.map((diet) => ({
                  value: diet.value,
                  label: diet.label,
                })),
              ]}
              placeholder="Select Food Preference"
              onChange={(name, value) => handleFilterChange('foodPreference', value === '' ? undefined : Number(value))}
            />

            {/* Occupation */}
            <CustomFormField
              id="occupation"
              name="occupation"
              label="Occupation"
              type="text"
              value={filters.occupation || ''}
              placeholder="Enter occupation..."
              onChange={(name, value) => handleFilterChange('occupation', value as string)}
              onTextChange={(e) => handleFilterChange('occupation', e.target.value)}
            />

            {/* Annual Income */}
            <CustomFormField
              id="annualIncome"
              name="annualIncome"
              label="Annual Income"
              type="text"
              value={filters.annualIncome || ''}
              placeholder="Enter income range..."
              onChange={(name, value) => handleFilterChange('annualIncome', value as string)}
              onTextChange={(e) => handleFilterChange('annualIncome', e.target.value)}
            />
          </div>
        )}
      </div>
    </>
  );
}
