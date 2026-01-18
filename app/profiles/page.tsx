'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ProfileFilters, { FilterState } from '@/components/ProfileFilters';

interface DropdownValue {
  value: number;
  label: string | null;
}

interface UserProfile {
  _id: string;
  name: string;
  photo: string;
  dateOfBirth: string;
  placeOfBirth: string;
  height: DropdownValue;
  complexion: DropdownValue;
  maritalStatus: DropdownValue;
  motherTongue: DropdownValue;
  religion: DropdownValue;
  caste: DropdownValue;
  gotra: DropdownValue;
  qualification: DropdownValue;
  collegeUniversity: string;
  occupation: string;
  organisationBusiness: string;
  annualIncome: string;
  fathersName: string;
  fathersOccupation: string;
  mothersName: string;
  mothersOccupation: string;
  siblings: string;
  city: DropdownValue;
  state: DropdownValue;
  foodPreference: DropdownValue;
  hobbies: string;
  mobileNumber: string;
  emailAddress: string;
  gender: DropdownValue;
}

export default function ProfilesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery]);

  // Fetch profiles when page, filters, or search changes
  useEffect(() => {
    fetchProfiles();
  }, [page, filters, searchQuery, user?.id]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add excludeUserId to exclude current user
      if (user?.id) {
        params.append('excludeUserId', user.id);
      }

      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get<{
        data: UserProfile[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/api/users?${params.toString()}`);

      if (response.success && response.data) {
        const backendData = response.data as any;
        const profilesArray: UserProfile[] = 
          (backendData.data && Array.isArray(backendData.data)) 
            ? backendData.data 
            : (Array.isArray(backendData) ? backendData : []);
        
        setProfiles(profilesArray);
        
        const pagination = response.pagination || {};
        setTotalPages(pagination.pages || 1);
        setTotal(pagination.total || 0);
      } else {
        setProfiles([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setError(err.message || 'Failed to fetch profiles');
      setProfiles([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, searchQuery, user?.id]);

  // Helper function to get label from dropdown value object
  const getLabel = (dropdownValue: DropdownValue | number | undefined): string => {
    if (!dropdownValue) return 'N/A';
    if (typeof dropdownValue === 'object' && 'label' in dropdownValue) {
      return dropdownValue.label || String(dropdownValue.value);
    }
    return String(dropdownValue);
  };

  if (loading && profiles.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-rose-600 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">Loading profiles...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Browse Profiles
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Filters and Results Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProfileFilters
                filters={filters}
                onFiltersChange={setFilters}
                onSearchChange={setSearchQuery}
                searchQuery={searchQuery}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">

              {profiles.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No profiles found.</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try adjusting your filters or search criteria.
                  </p>
                </div>
              ) : (
                <>
                  {/* Results Count */}
                  {total > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                      Found {total} profile{total !== 1 ? 's' : ''}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {profiles.map((profile) => (
                  <div
                    key={profile._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        {profile.photo ? (
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-rose-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl text-gray-400">
                              {profile.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {profile.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getLabel(profile.gender)}
                          </p>
                          {profile.height && (
                            <p className="text-sm text-gray-600">
                              Height: {getLabel(profile.height)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        {profile.occupation && (
                          <p>
                            <span className="font-semibold">Occupation:</span>{' '}
                            {profile.occupation}
                          </p>
                        )}
                        {profile.qualification && (
                          <p>
                            <span className="font-semibold">Qualification:</span>{' '}
                            {getLabel(profile.qualification)}
                          </p>
                        )}
                        {profile.maritalStatus && (
                          <p>
                            <span className="font-semibold">Marital Status:</span>{' '}
                            {getLabel(profile.maritalStatus)}
                          </p>
                        )}
                        {profile.placeOfBirth && (
                          <p>
                            <span className="font-semibold">Place of Birth:</span>{' '}
                            {profile.placeOfBirth}
                          </p>
                        )}
                        {profile.hobbies && (
                          <p>
                            <span className="font-semibold">Hobbies:</span>{' '}
                            {profile.hobbies}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/profiles/${profile._id}`}
                        className="mt-4 w-full block text-center bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  {/* Results Info */}
                  <div className="text-center text-sm text-gray-600 mb-4">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} profiles
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    {/* Previous Button */}
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              page === pageNum
                                ? 'bg-rose-600 text-white font-semibold'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      Next
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Page Info */}
                  <div className="text-center text-sm text-gray-500 mt-4">
                    Page {page} of {totalPages}
                  </div>
                </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
