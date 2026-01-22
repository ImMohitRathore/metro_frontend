'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DropdownValue {
  value: number;
  label: string | null;
}

interface UserProfile {
  _id: string;
  name: string;
  gender: DropdownValue;
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
}

interface Plan {
  _id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface Subscription {
  _id: string;
  userId: string;
  planId: Plan | string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Helper function to get label from dropdown value object
  const getLabel = (dropdownValue: DropdownValue | undefined): string => {
    if (!dropdownValue) return 'N/A';
    if (typeof dropdownValue === 'object' && 'label' in dropdownValue) {
      return dropdownValue.label || String(dropdownValue.value);
    }
    return String(dropdownValue);
  };

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<UserProfile>(`/api/users/${user.id}`);

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError('Profile not found');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingSubscription(true);
      const response = await api.get<{ success: boolean; data: Subscription | null }>(
        `/api/subscriptions/user/${user.id}`
      );
      if (response.success && response.data) {
        setSubscription(response.data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoadingSubscription(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
  }, [fetchProfile, fetchSubscription]);

  if (loading) {
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
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 text-lg mb-4">{error || 'Profile not found'}</p>
              <Link
                href="/"
                className="inline-block bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Back to Home
              </Link>
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
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {subscription ? 'Manage Subscription' : 'Buy Plan'}
            </Link>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </Link>
          </div>

          {/* Subscription Details Card */}
          {subscription && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Active Subscription
                    </h3>
                    <p className="text-gray-700">
                      {typeof subscription.planId === 'object' && subscription.planId
                        ? subscription.planId.name
                        : 'Premium Plan'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Expires on</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-semibold text-green-700 capitalize">
                      {subscription.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Started:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(subscription.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {typeof subscription.planId === 'object' && subscription.planId
                        ? `₹${subscription.planId.price}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!subscription && !loadingSubscription && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-500 rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      No Active Subscription
                    </h3>
                    <p className="text-gray-700">
                      Subscribe to a plan to view unlimited profiles and access all features.
                    </p>
                  </div>
                </div>
                <Link
                  href="/subscription"
                  className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  View Plans
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-5xl text-gray-400">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-center md:text-left text-white">
                  <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex flex-wrap gap-4 text-lg">
                    <span>{getLabel(profile.gender)}</span>
                    {profile.height && (
                      <span>• Height: {getLabel(profile.height)}</span>
                    )}
                    {profile.maritalStatus && (
                      <span>• {getLabel(profile.maritalStatus)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Details */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-rose-200 pb-2">
                    Personal Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-semibold text-gray-700">Date of Birth:</span>
                      <p className="text-gray-600">{profile.dateOfBirth}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Place of Birth:</span>
                      <p className="text-gray-600">{profile.placeOfBirth}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Complexion:</span>
                      <p className="text-gray-600">{getLabel(profile.complexion)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother Tongue:</span>
                      <p className="text-gray-600">{getLabel(profile.motherTongue)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Religion:</span>
                      <p className="text-gray-600">{getLabel(profile.religion)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Caste:</span>
                      <p className="text-gray-600">{getLabel(profile.caste)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Gotra:</span>
                      <p className="text-gray-600">{getLabel(profile.gotra)}</p>
                    </div>
                  </div>
                </div>

                {/* Education & Occupation */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-rose-200 pb-2">
                    Education & Occupation
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-semibold text-gray-700">Qualification:</span>
                      <p className="text-gray-600">{getLabel(profile.qualification)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">College/University:</span>
                      <p className="text-gray-600">{profile.collegeUniversity}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Occupation:</span>
                      <p className="text-gray-600">{profile.occupation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Organisation/Business:</span>
                      <p className="text-gray-600">{profile.organisationBusiness}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Annual Income:</span>
                      <p className="text-gray-600">₹{profile.annualIncome}</p>
                    </div>
                  </div>
                </div>

                {/* Family Details */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-rose-200 pb-2">
                    Family Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-semibold text-gray-700">Father&apos;s Name:</span>
                      <p className="text-gray-600">{profile.fathersName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Father&apos;s Occupation:</span>
                      <p className="text-gray-600">{profile.fathersOccupation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother&apos;s Name:</span>
                      <p className="text-gray-600">{profile.mothersName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Mother&apos;s Occupation:</span>
                      <p className="text-gray-600">{profile.mothersOccupation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Siblings:</span>
                      <p className="text-gray-600">{profile.siblings}</p>
                    </div>
                  </div>
                </div>

                {/* Address & Lifestyle */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-rose-200 pb-2">
                    Address & Lifestyle
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="font-semibold text-gray-700">City:</span>
                      <p className="text-gray-600">{getLabel(profile.city)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">State:</span>
                      <p className="text-gray-600">{getLabel(profile.state)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Food Preference:</span>
                      <p className="text-gray-600">{getLabel(profile.foodPreference)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Hobbies:</span>
                      <p className="text-gray-600">{profile.hobbies}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-6 md:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-rose-200 pb-2">
                    Contact Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold text-gray-700">Mobile Number:</span>
                      <p className="text-gray-600">{profile.mobileNumber}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Email Address:</span>
                      <p className="text-gray-600">{profile.emailAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
