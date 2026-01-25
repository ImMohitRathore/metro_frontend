'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatModal from '@/components/ChatModal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@/hooks/useApi';
import { useChat } from '@/hooks/useChat';

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
  interestStatus?: string | null; // Interest status: 'accepted', 'pending', 'rejected', or null
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = params.id as string;
  
  // Check if we should return to admin dashboard (only if returnTo parameter is set)
  const returnTo = searchParams.get('returnTo');
  const isFromAdmin = returnTo === 'admin';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Mutation for sending interest
  const { mutate: sendInterest } = useMutation(
    '/api/interests',
    {
      onSuccess: (data) => {
        console.log('Interest sent successfully:', data);
        alert('Interest sent successfully! The user will be notified.');
        setSendingInterest(false);
      },
      onError: (error) => {
        console.error('Error sending interest:', error);
        alert(error.message || 'Failed to send interest. Please try again.');
        setSendingInterest(false);
      },
    }
  );

  // Chat hook
  const { getOrCreateConversation } = useChat();

  // Helper function to get label from dropdown value object
  const getLabel = (dropdownValue: DropdownValue | undefined): string => {
    if (!dropdownValue) return 'N/A';
    if (typeof dropdownValue === 'object' && 'label' in dropdownValue) {
      return dropdownValue.label || String(dropdownValue.value);
    }
    return String(dropdownValue);
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Include currentUserId in query params if user is logged in
      const queryParam = user?.id ? `?currentUserId=${user.id}` : '';
      const response = await api.get<UserProfile>(`/api/users/${userId}${queryParam}`);

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
  }, [userId, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


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
                href={isFromAdmin ? "/admin" : "/profiles"}
                className="inline-block bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                {isFromAdmin ? "Back to Admin Dashboard" : "Back to Profiles"}
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
          {/* Back Button */}
          <Link
            href={isFromAdmin ? "/admin" : "/profiles"}
            className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-6 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            {isFromAdmin ? "Back to Admin Dashboard" : "Back to Profiles"}
          </Link>

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
              </div>

              {/* Contact Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">Mobile Number:</span>
                    <p className="text-gray-600">+91 {profile.mobileNumber}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email Address:</span>
                    <p className="text-gray-600">{profile.emailAddress}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {profile.interestStatus === 'accepted' ? (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        router.push('/login');
                        return;
                      }
                      setIsChatOpen(true);
                    }}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Chat Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        router.push('/login');
                        return;
                      }
                      setSendingInterest(true);
                      sendInterest({
                        fromUserId: user.id,
                        toUserId: profile._id,
                      }, 'POST');
                    }}
                    disabled={sendingInterest || !user?.id || user.id === profile._id || profile.interestStatus === 'pending'}
                    className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingInterest ? 'Sending...' : profile.interestStatus === 'pending' ? 'Interest Pending' : 'Send Interest'}
                  </button>
                )}
                <button className="flex-1 border-2 border-rose-600 text-rose-600 px-6 py-3 rounded-lg hover:bg-rose-50 transition-colors font-semibold">
                  Request Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Modal */}
        {profile && (
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            otherUserId={profile._id}
            otherUserName={profile.name}
            otherUserPhoto={profile.photo}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
