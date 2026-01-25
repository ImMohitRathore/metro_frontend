'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import CustomFormField from '@/components/CustomFormField';

interface DropdownValue {
  value: number;
  label: string | null;
}

interface UserProfile {
  _id: string;
  name: string;
  photo: string;
  emailAddress: string;
  mobileNumber: string;
  gender: DropdownValue;
  city: DropdownValue;
  state: DropdownValue;
  isActive: boolean;
  hasActiveSubscription: boolean;
  subscription: {
    status: string;
    endDate: string;
    planId: string;
  } | null;
  createdAt: string;
}

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    paid: number;
    free: number;
  };
  subscriptions: {
    total: number;
    active: number;
  };
}

interface DropdownOption {
  _id: string;
  value: number;
  label: string;
  isActive: boolean;
}

interface AdminFilters {
  search?: string;
  isActive?: string;
  hasSubscription?: string;
  gender?: number;
  state?: number;
  city?: number;
  sortBy?: string;
  sortOrder?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dropdowns, setDropdowns] = useState<{
    genders: DropdownOption[];
    states: DropdownOption[];
    cities: DropdownOption[];
  }>({
    genders: [],
    states: [],
    cities: [],
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'admin') {
        router.push('/profiles');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchDropdowns();
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  useEffect(() => {
    if (filters.state) {
      fetchCitiesByState(filters.state);
    } else {
      setDropdowns((prev) => ({ ...prev, cities: [] }));
    }
  }, [filters.state]);

  const fetchStats = async () => {
    try {
      const response = await api.get<{ success: boolean; data: AdminStats }>(
        `/api/admin/stats?userId=${user?.id}`
      );
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [gendersRes, statesRes] = await Promise.all([
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/genders'),
        api.get<{ success: boolean; data: DropdownOption[] }>('/api/dropdown/states'),
      ]);

      const getDropdownData = (response: any): DropdownOption[] => {
        if (!response || !response.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
        return [];
      };

      setDropdowns({
        genders: getDropdownData(gendersRes),
        states: getDropdownData(statesRes),
        cities: [],
      });
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const fetchCitiesByState = async (stateValue: number) => {
    try {
      const response = await api.get<{ success: boolean; data: DropdownOption[] }>(
        `/api/dropdown/cities?stateId=${stateValue}`
      );
      const getDropdownData = (response: any): DropdownOption[] => {
        if (!response || !response.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
        return [];
      };
      setDropdowns((prev) => ({ ...prev, cities: getDropdownData(response) }));
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      params.append('userId', user?.id || '');

      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
      if (filters.hasSubscription !== undefined) params.append('hasSubscription', filters.hasSubscription);
      if (filters.gender) params.append('gender', filters.gender.toString());
      if (filters.state) params.append('state', filters.state.toString());
      if (filters.city) params.append('city', filters.city.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get<{
        success: boolean;
        data: UserProfile[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/api/admin/users?${params.toString()}`);

      if (response.success && response.data) {
        setUsers(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      setProcessing(userId);
      const response = await api.patch<{ success: boolean; message: string }>(
        `/api/admin/users/${userId}/active?userId=${user?.id}`,
        { isActive: !currentStatus }
      );

      if (response.success) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    } finally {
      setProcessing(null);
    }
  };

  const handleFilterChange = (name: string, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value === '' || value === undefined ? undefined : value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Show loading or redirect if not admin
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users and profiles</p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Profiles</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.users.active}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Paid Users</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.users.paid}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.subscriptions.active}</p>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showFilters && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <CustomFormField
                  name="search"
                  label="Search"
                  type="text"
                  value={filters.search || ''}
                  placeholder="Search by name, email, or phone"
                  onChange={(name, value) => handleFilterChange(name, value as string)}
                />

                {/* Active Status */}
                <CustomFormField
                  name="isActive"
                  label="Profile Status"
                  type="select"
                  value={filters.isActive || ''}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                  placeholder="Select Status"
                  onChange={(name, value) => handleFilterChange(name, value as string)}
                />

                {/* Subscription Status */}
                <CustomFormField
                  name="hasSubscription"
                  label="Subscription Status"
                  type="select"
                  value={filters.hasSubscription || ''}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'true', label: 'Paid Users' },
                    { value: 'false', label: 'Free Users' },
                  ]}
                  placeholder="Select Subscription"
                  onChange={(name, value) => handleFilterChange(name, value as string)}
                />

                {/* Gender */}
                <CustomFormField
                  name="gender"
                  label="Gender"
                  type="select"
                  value={filters.gender || ''}
                  options={[
                    { value: '', label: 'All' },
                    ...dropdowns.genders.map((g) => ({
                      value: g.value,
                      label: g.label,
                    })),
                  ]}
                  placeholder="Select Gender"
                  onChange={(name, value) => handleFilterChange(name, value === '' ? undefined : Number(value))}
                />

                {/* State */}
                <CustomFormField
                  name="state"
                  label="State"
                  type="select"
                  value={filters.state || ''}
                  options={[
                    { value: '', label: 'All' },
                    ...dropdowns.states.map((s) => ({
                      value: s.value,
                      label: s.label,
                    })),
                  ]}
                  placeholder="Select State"
                  onChange={(name, value) => {
                    const stateValue = value === '' ? undefined : Number(value);
                    handleFilterChange(name, stateValue);
                    if (!stateValue) {
                      handleFilterChange('city', undefined);
                    }
                  }}
                />

                {/* City */}
                {filters.state && (
                  <CustomFormField
                    name="city"
                    label="City"
                    type="select"
                    value={filters.city || ''}
                    options={[
                      { value: '', label: 'All' },
                      ...dropdowns.cities.map((c) => ({
                        value: c.value,
                        label: c.label,
                      })),
                    ]}
                    placeholder="Select City"
                    onChange={(name, value) => handleFilterChange(name, value === '' ? undefined : Number(value))}
                  />
                )}

                {/* Sort By */}
                <CustomFormField
                  name="sortBy"
                  label="Sort By"
                  type="select"
                  value={filters.sortBy || 'createdAt'}
                  options={[
                    { value: 'createdAt', label: 'Date Created' },
                    { value: 'name', label: 'Name' },
                  ]}
                  placeholder="Sort By"
                  onChange={(name, value) => handleFilterChange(name, value as string)}
                />

                {/* Sort Order */}
                <CustomFormField
                  name="sortOrder"
                  label="Sort Order"
                  type="select"
                  value={filters.sortOrder || 'desc'}
                  options={[
                    { value: 'desc', label: 'Descending' },
                    { value: 'asc', label: 'Ascending' },
                  ]}
                  placeholder="Sort Order"
                  onChange={(name, value) => handleFilterChange(name, value as string)}
                />

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Users ({total})</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((userProfile) => (
                        <tr key={userProfile._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={userProfile.photo || '/placeholder-avatar.png'}
                                alt={userProfile.name}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{userProfile.name}</div>
                                <div className="text-sm text-gray-500">
                                  {userProfile.gender?.label || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userProfile.emailAddress}</div>
                            <div className="text-sm text-gray-500">{userProfile.mobileNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {userProfile.city?.label || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userProfile.state?.label || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                userProfile.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {userProfile.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {userProfile.hasActiveSubscription ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Free
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleToggleActive(userProfile._id, userProfile.isActive)}
                              disabled={processing === userProfile._id}
                              className={`mr-2 px-3 py-1 rounded ${
                                userProfile.isActive
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              } ${processing === userProfile._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {processing === userProfile._id
                                ? 'Processing...'
                                : userProfile.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                            <Link
                              href={`/profiles/${userProfile._id}?returnTo=admin`}
                              className="text-rose-600 hover:text-rose-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                      <span className="font-medium">{total}</span> users
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          ««
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
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
                                className={`px-3 py-2 border rounded-md text-sm font-medium ${
                                  page === pageNum
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          »»
                        </button>
                      </div>
                    )}
                    {totalPages === 1 && (
                      <div className="text-sm text-gray-500">
                        Page 1 of 1
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
