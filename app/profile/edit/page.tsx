'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import CustomFormField from '@/components/CustomFormField';
import PhotoUpload from '@/components/PhotoUpload';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { DropdownOption } from '@/hooks/useDropdown';
import { useMutation } from '@/hooks/useApi';
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

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    name: '',
    gender: '' as string | number | '',
    photo: '',
    dateOfBirth: '',
    placeOfBirth: '',
    height: '' as string | number | '',
    complexion: '' as string | number | '',
    maritalStatus: '' as string | number | '',
    motherTongue: '' as string | number | '',
    religion: '' as string | number | '',
    caste: '' as string | number | '',
    gotra: '' as string | number | '',
    // Step 2: Education & Occupation
    qualification: '' as string | number | '',
    collegeUniversity: '',
    occupation: '',
    organisationBusiness: '',
    annualIncome: '',
    // Step 3: Family Details
    fathersName: '',
    fathersOccupation: '',
    mothersName: '',
    mothersOccupation: '',
    siblings: '',
    // Step 4: Address Details
    city: '' as string | number | '',
    state: '' as string | number | '',
    // Step 5: Lifestyle
    foodPreference: '' as string | number | '',
    hobbies: '',
    // Contact Details (read-only)
    mobileNumber: '',
    emailAddress: '',
  });

  const [errors, setErrors] = useState<{ 
    [key: string]: string | undefined;
  }>({});

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const response = await api.get<UserProfile>(`/api/users/${user.id}`);

        if (response.success && response.data) {
          const profile = response.data;
          setFormData({
            name: profile.name || '',
            gender: profile.gender?.value || '',
            photo: profile.photo || '',
            dateOfBirth: profile.dateOfBirth || '',
            placeOfBirth: profile.placeOfBirth || '',
            height: profile.height?.value || '',
            complexion: profile.complexion?.value || '',
            maritalStatus: profile.maritalStatus?.value || '',
            motherTongue: profile.motherTongue?.value || '',
            religion: profile.religion?.value || '',
            caste: profile.caste?.value || '',
            gotra: profile.gotra?.value || '',
            qualification: profile.qualification?.value || '',
            collegeUniversity: profile.collegeUniversity || '',
            occupation: profile.occupation || '',
            organisationBusiness: profile.organisationBusiness || '',
            annualIncome: profile.annualIncome || '',
            fathersName: profile.fathersName || '',
            fathersOccupation: profile.fathersOccupation || '',
            mothersName: profile.mothersName || '',
            mothersOccupation: profile.mothersOccupation || '',
            siblings: profile.siblings || '',
            city: profile.city?.value || '',
            state: profile.state?.value || '',
            foodPreference: profile.foodPreference?.value || '',
            hobbies: profile.hobbies || '',
            mobileNumber: profile.mobileNumber || '',
            emailAddress: profile.emailAddress || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Mutation hook for form submission
  const { mutate: updateProfile, loading: isSubmitting, error: submitError } = useMutation(
    user?.id ? `/api/users/${user.id}` : null,
    {
      method: 'PUT',
      onSuccess: (data) => {
        console.log('Profile updated successfully:', data);
        alert('Profile updated successfully!');
        router.push('/profile');
      },
      onError: (error) => {
        console.error('Update error:', error);
        setErrors({ submit: error.message || 'Failed to update profile. Please try again.' });
      },
    }
  );

  // Fetch dropdown data from API
  const { data: genderOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/genders',
    { immediate: true }
  );

  const { data: heightOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/heights',
    { immediate: true }
  );

  const { data: complexionOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/complexions',
    { immediate: true }
  );

  const { data: maritalStatusOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/marital-statuses',
    { immediate: true }
  );

  const { data: motherTongueOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/communities',
    { immediate: true }
  );

  const { data: religionOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/religions',
    { immediate: true }
  );

  const { data: casteOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/castes',
    { immediate: true }
  );

  const { data: gotraOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/gotras',
    { immediate: true }
  );

  const { data: qualificationOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/qualifications',
    { immediate: true }
  );

  const { data: cityOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/cities',
    { immediate: true }
  );

  const { data: stateOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/states',
    { immediate: true }
  );

  const { data: foodPreferenceOptions } = useApi<DropdownOption[]>(
    '/api/dropdown/diets',
    { immediate: true }
  );

  // Fetch cities when state changes
  const [filteredCityOptions, setFilteredCityOptions] = useState<DropdownOption[]>([]);
  const [loadingCitiesByState, setLoadingCitiesByState] = useState(false);

  useEffect(() => {
    const fetchCitiesByState = async () => {
      if (formData.state && stateOptions) {
        setLoadingCitiesByState(true);
        try {
          const response = await api.get<DropdownOption[]>(
            `/api/dropdown/cities?stateId=${formData.state}`
          );
          if (response.success && response.data) {
            setFilteredCityOptions(response.data);
          } else {
            setFilteredCityOptions(cityOptions || []);
          }
        } catch (error) {
          console.error('Error fetching cities by state:', error);
          setFilteredCityOptions(cityOptions || []);
        } finally {
          setLoadingCitiesByState(false);
        }
      } else {
        setFilteredCityOptions(cityOptions || []);
      }
    };

    fetchCitiesByState();
  }, [formData.state, cityOptions, stateOptions]);

  // Use filtered cities or all cities
  const availableCityOptions = useMemo(() => {
    if (formData.state && filteredCityOptions.length > 0) {
      return filteredCityOptions;
    }
    return cityOptions || [];
  }, [formData.state, filteredCityOptions, cityOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };
      if (name === 'state') {
        newData.city = '';
      }
      return newData;
    });
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePhotoChange = (base64Image: string) => {
    setFormData(prev => ({
      ...prev,
      photo: base64Image,
    }));
    if (errors.photo) {
      setErrors(prev => ({
        ...prev,
        photo: undefined,
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.gender) newErrors.gender = 'Please select gender';
      if (!formData.photo) newErrors.photo = 'Photo is required';
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = 'Place of birth is required';
      if (!formData.height) newErrors.height = 'Please select height';
      if (!formData.complexion) newErrors.complexion = 'Please select complexion';
      if (!formData.maritalStatus) newErrors.maritalStatus = 'Please select marital status';
      if (!formData.motherTongue) newErrors.motherTongue = 'Please select mother tongue';
      if (!formData.religion) newErrors.religion = 'Please select religion';
      if (!formData.caste) newErrors.caste = 'Please select caste';
      if (!formData.gotra) newErrors.gotra = 'Please select gotra';
    }

    if (step === 2) {
      if (!formData.qualification) newErrors.qualification = 'Please select qualification';
      if (!formData.collegeUniversity.trim()) newErrors.collegeUniversity = 'College/University is required';
      if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
      if (!formData.organisationBusiness.trim()) newErrors.organisationBusiness = 'Organisation/Business is required';
      if (!formData.annualIncome.trim()) newErrors.annualIncome = 'Annual income is required';
    }

    if (step === 3) {
      if (!formData.fathersName.trim()) newErrors.fathersName = "Father's name is required";
      if (!formData.fathersOccupation.trim()) newErrors.fathersOccupation = "Father's occupation is required";
      if (!formData.mothersName.trim()) newErrors.mothersName = "Mother's name is required";
      if (!formData.mothersOccupation.trim()) newErrors.mothersOccupation = "Mother's occupation is required";
      if (!formData.siblings.trim()) newErrors.siblings = 'Siblings information is required';
    }

    if (step === 4) {
      if (!formData.city) newErrors.city = 'Please select city';
      if (!formData.state) newErrors.state = 'Please select state';
    }

    if (step === 5) {
      if (!formData.foodPreference) newErrors.foodPreference = 'Please select food preference';
      if (!formData.hobbies.trim()) newErrors.hobbies = 'Hobbies are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // If it's the last step, submit the form
      if (currentStep === 5) {
        try {
          await updateProfile(formData, 'PUT');
        } catch (error) {
          console.error('Update failed:', error);
        }
      } else {
        // Move to next step
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CustomFormField
                  id="name"
                  name="name"
                  label="Name"
                  type="text"
                  value={formData.name}
                  placeholder="Enter your full name"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.name}
                />
              </div>

              <CustomFormField
                id="gender"
                name="gender"
                label="Gender"
                type="select"
                value={formData.gender}
                options={genderOptions || []}
                placeholder="Select gender"
                onChange={handleSelectChange}
                error={errors.gender}
              />

              <div className="flex items-end justify-center">
                <div className="w-full max-w-xs">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Photo
                  </label>
                  <PhotoUpload
                    value={formData.photo}
                    onChange={handlePhotoChange}
                    error={errors.photo}
                  />
                </div>
              </div>

              <CustomFormField
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.dateOfBirth}
              />

              <CustomFormField
                id="placeOfBirth"
                name="placeOfBirth"
                label="Place of Birth"
                type="text"
                value={formData.placeOfBirth}
                placeholder="Enter place of birth"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.placeOfBirth}
              />

              <CustomFormField
                id="height"
                name="height"
                label="Height"
                type="select"
                value={formData.height}
                options={heightOptions || []}
                placeholder="Select height"
                onChange={handleSelectChange}
                error={errors.height}
              />

              <CustomFormField
                id="complexion"
                name="complexion"
                label="Complexion"
                type="select"
                value={formData.complexion}
                options={complexionOptions || []}
                placeholder="Select complexion"
                onChange={handleSelectChange}
                error={errors.complexion}
              />

              <CustomFormField
                id="maritalStatus"
                name="maritalStatus"
                label="Marital Status"
                type="select"
                value={formData.maritalStatus}
                options={maritalStatusOptions || []}
                placeholder="Select marital status"
                onChange={handleSelectChange}
                error={errors.maritalStatus}
              />

              <CustomFormField
                id="motherTongue"
                name="motherTongue"
                label="Mother Tongue"
                type="select"
                value={formData.motherTongue}
                options={motherTongueOptions || []}
                placeholder="Select mother tongue"
                onChange={handleSelectChange}
                error={errors.motherTongue}
              />

              <CustomFormField
                id="religion"
                name="religion"
                label="Religion"
                type="select"
                value={formData.religion}
                options={religionOptions || []}
                placeholder="Select religion"
                onChange={handleSelectChange}
                error={errors.religion}
              />

              <CustomFormField
                id="caste"
                name="caste"
                label="Caste"
                type="select"
                value={formData.caste}
                options={casteOptions || []}
                placeholder="Select caste"
                onChange={handleSelectChange}
                error={errors.caste}
              />

              <CustomFormField
                id="gotra"
                name="gotra"
                label="Gotra"
                type="select"
                value={formData.gotra}
                options={gotraOptions || []}
                placeholder="Select gotra"
                onChange={handleSelectChange}
                error={errors.gotra}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Education & Occupation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomFormField
                id="qualification"
                name="qualification"
                label="Qualification"
                type="select"
                value={formData.qualification}
                options={qualificationOptions || []}
                placeholder="Select qualification"
                onChange={handleSelectChange}
                error={errors.qualification}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="collegeUniversity"
                  name="collegeUniversity"
                  label="College/University"
                  type="text"
                  value={formData.collegeUniversity}
                  placeholder="Enter college/university name"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.collegeUniversity}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="occupation"
                  name="occupation"
                  label="Occupation"
                  type="text"
                  value={formData.occupation}
                  placeholder="Enter your occupation"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.occupation}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="organisationBusiness"
                  name="organisationBusiness"
                  label="Organisation/Business"
                  type="text"
                  value={formData.organisationBusiness}
                  placeholder="Enter organisation/business name"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.organisationBusiness}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="annualIncome"
                  name="annualIncome"
                  label="Annual Income"
                  type="text"
                  value={formData.annualIncome}
                  placeholder="Enter annual income"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.annualIncome}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Family Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomFormField
                id="fathersName"
                name="fathersName"
                label="Father&apos;s Name"
                type="text"
                value={formData.fathersName}
                placeholder="Enter father&apos;s name"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.fathersName}
              />

              <CustomFormField
                id="fathersOccupation"
                name="fathersOccupation"
                label="Father&apos;s Occupation"
                type="text"
                value={formData.fathersOccupation}
                placeholder="Enter father&apos;s occupation"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.fathersOccupation}
              />

              <CustomFormField
                id="mothersName"
                name="mothersName"
                label="Mother&apos;s Name"
                type="text"
                value={formData.mothersName}
                placeholder="Enter mother&apos;s name"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.mothersName}
              />

              <CustomFormField
                id="mothersOccupation"
                name="mothersOccupation"
                label="Mother&apos;s Occupation"
                type="text"
                value={formData.mothersOccupation}
                placeholder="Enter mother&apos;s occupation"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.mothersOccupation}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="siblings"
                  name="siblings"
                  label="Siblings"
                  type="text"
                  value={formData.siblings}
                  placeholder="Enter siblings information (e.g., 1 brother, 2 sisters)"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.siblings}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Address Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomFormField
                id="state"
                name="state"
                label="State"
                type="select"
                value={formData.state}
                options={stateOptions || []}
                placeholder="Select state"
                onChange={handleSelectChange}
                error={errors.state}
              />

              <CustomFormField
                id="city"
                name="city"
                label="City"
                type="select"
                value={formData.city}
                options={availableCityOptions}
                placeholder={formData.state ? "Select city" : "Select state first"}
                onChange={handleSelectChange}
                disabled={!formData.state || loadingCitiesByState}
                error={errors.city}
              />
            </div>
            {!formData.state && (
              <p className="mt-2 text-xs text-gray-500">Please select state first to filter cities</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lifestyle & Contact Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomFormField
                id="foodPreference"
                name="foodPreference"
                label="Food Preference"
                type="select"
                value={formData.foodPreference}
                options={foodPreferenceOptions || []}
                placeholder="Select food preference"
                onChange={handleSelectChange}
                error={errors.foodPreference}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="hobbies"
                  name="hobbies"
                  label="Hobbies"
                  type="textarea"
                  value={formData.hobbies}
                  placeholder="Enter your hobbies"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.hobbies}
                  rows={4}
                />
              </div>

              {/* Read-only Contact Details */}
              <div className="md:col-span-2 lg:col-span-3 mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details (Read-only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mobile Number:
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 font-medium">
                        +91
                      </div>
                      <input
                        type="text"
                        value={formData.mobileNumber}
                        disabled
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-r-lg text-gray-600 bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Mobile number cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email Address:
                    </label>
                    <input
                      type="email"
                      value={formData.emailAddress}
                      disabled
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-600 bg-gray-100 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return !!(
        formData.name.trim() &&
        formData.gender &&
        formData.photo &&
        formData.dateOfBirth.trim() &&
        formData.placeOfBirth.trim() &&
        formData.height &&
        formData.complexion &&
        formData.maritalStatus &&
        formData.motherTongue &&
        formData.religion &&
        formData.caste &&
        formData.gotra
      );
    }
    if (step === 2) {
      return !!(
        formData.qualification &&
        formData.collegeUniversity.trim() &&
        formData.occupation.trim() &&
        formData.organisationBusiness.trim() &&
        formData.annualIncome.trim()
      );
    }
    if (step === 3) {
      return !!(
        formData.fathersName.trim() &&
        formData.fathersOccupation.trim() &&
        formData.mothersName.trim() &&
        formData.mothersOccupation.trim() &&
        formData.siblings.trim()
      );
    }
    if (step === 4) {
      return !!(formData.city && formData.state);
    }
    if (step === 5) {
      return !!(formData.foodPreference && formData.hobbies.trim());
    }
    return false;
  };

  if (loadingProfile) {
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

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col overflow-hidden">
        <Navbar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8 relative">
              {/* Back Button */}
              <Link
                href="/profile"
                className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-colors z-10"
              >
                <svg
                  className="w-6 h-6"
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
              </Link>

              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= currentStep ? 'bg-rose-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600">
                  Step {currentStep} of 5
                </p>
              </div>

              {/* Form Content */}
              <div className="mt-8">
                {renderStepContent()}
              </div>

              {/* Continue Button */}
              <div className="mt-8 flex flex-col items-center">
                {submitError && (
                  <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{submitError.message || 'Failed to update profile. Please try again.'}</p>
                  </div>
                )}
                {errors.submit && (
                  <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
                <button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep) || isSubmitting}
                  className={`px-12 py-3 rounded-lg font-semibold transition-colors ${
                    isStepValid(currentStep) && !isSubmitting
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    currentStep === 5 ? 'Update Profile' : 'Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
