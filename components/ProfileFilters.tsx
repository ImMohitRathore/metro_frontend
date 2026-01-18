'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Name, Mobile, or Email
              </label>
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Enter name, mobile, or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {localSearchQuery !== searchQuery && (
                <p className="mt-1 text-xs text-gray-500">Searching...</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.genders.map((gender) => (
                  <option key={gender._id} value={gender.value}>
                    {gender.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={filters.minAge || ''}
                  onChange={(e) => handleFilterChange('minAge', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={filters.maxAge || ''}
                  onChange={(e) => handleFilterChange('maxAge', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <select
                value={filters.height || ''}
                onChange={(e) => handleFilterChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.heights.map((height) => (
                  <option key={height._id} value={height.value}>
                    {height.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                value={filters.maritalStatus || ''}
                onChange={(e) => handleFilterChange('maritalStatus', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.maritalStatuses.map((status) => (
                  <option key={status._id} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Religion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Religion
              </label>
              <select
                value={filters.religion || ''}
                onChange={(e) => handleFilterChange('religion', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.religions.map((religion) => (
                  <option key={religion._id} value={religion.value}>
                    {religion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Caste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caste
              </label>
              <select
                value={filters.caste || ''}
                onChange={(e) => handleFilterChange('caste', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.castes.map((caste) => (
                  <option key={caste._id} value={caste.value}>
                    {caste.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification
              </label>
              <select
                value={filters.qualification || ''}
                onChange={(e) => handleFilterChange('qualification', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.qualifications.map((qual) => (
                  <option key={qual._id} value={qual.value}>
                    {qual.label}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={filters.state || ''}
                onChange={(e) => {
                  const stateValue = e.target.value ? parseInt(e.target.value) : undefined;
                  handleFilterChange('state', stateValue);
                  // Clear city when state changes
                  if (!stateValue) {
                    handleFilterChange('city', undefined);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.states.map((state) => (
                  <option key={state._id} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            {filters.state && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  disabled={!filters.state || dropdowns.cities.length === 0}
                >
                  <option value="">All</option>
                  {dropdowns.cities.map((city) => (
                    <option key={city._id} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Food Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Preference
              </label>
              <select
                value={filters.foodPreference || ''}
                onChange={(e) => handleFilterChange('foodPreference', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All</option>
                {dropdowns.diets.map((diet) => (
                  <option key={diet._id} value={diet.value}>
                    {diet.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={filters.occupation || ''}
                onChange={(e) => handleFilterChange('occupation', e.target.value)}
                placeholder="Enter occupation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Annual Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income
              </label>
              <input
                type="text"
                value={filters.annualIncome || ''}
                onChange={(e) => handleFilterChange('annualIncome', e.target.value)}
                placeholder="Enter income range..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
