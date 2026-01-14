'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CustomFormField from '@/components/CustomFormField';
import PhotoUpload from '@/components/PhotoUpload';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { DropdownOption } from '@/hooks/useDropdown';
import { useMutation } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
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
    // Step 6: Contact Details
    mobileNumber: '',
    emailAddress: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ 
    [key: string]: string | undefined;
  }>({});

  // Mutation hook for form submission
  const { mutate: submitRegistration, loading: isSubmitting, error: submitError } = useMutation(
    '/api/users/register',
    {
      onSuccess: (data) => {
        console.log('Registration successful:', data);
        // Redirect to login after successful registration
        alert('Registration successful! Please login to continue.');
        router.push('/login');
      },
      onError: (error) => {
        console.error('Registration error:', error);
        setErrors({ submit: error.message || 'Failed to register. Please try again.' });
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

  // Fetch states by city when city is selected
  const [filteredStateOptions, setFilteredStateOptions] = useState<DropdownOption[]>([]);
  const [loadingStatesByCity, setLoadingStatesByCity] = useState(false);

  useEffect(() => {
    const fetchStatesByCity = async () => {
      if (formData.city && stateOptions) {
        setLoadingStatesByCity(true);
        try {
          const response = await api.get<DropdownOption[]>(
            `/api/dropdown/states/by-city?cityId=${formData.city}`
          );
          if (response.success && response.data) {
            setFilteredStateOptions(response.data);
          } else {
            setFilteredStateOptions(stateOptions);
          }
        } catch (error) {
          console.error('Error fetching states by city:', error);
          setFilteredStateOptions(stateOptions || []);
        } finally {
          setLoadingStatesByCity(false);
        }
      } else {
        setFilteredStateOptions(stateOptions || []);
      }
    };

    fetchStatesByCity();
  }, [formData.city, stateOptions]);

  // Use filtered states or all states
  const availableStateOptions = useMemo(() => {
    if (formData.city && filteredStateOptions.length > 0) {
      return filteredStateOptions;
    }
    return stateOptions || [];
  }, [formData.city, filteredStateOptions, stateOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Only allow numbers for phone number
    if (name === 'mobileNumber' && value && !/^\d+$/.test(value)) {
      return;
    }
    
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
      if (name === 'city') {
        newData.state = '';
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
      if (!formData.fathersName.trim()) newErrors.fathersName = "Father&apos;s name is required";
      if (!formData.fathersOccupation.trim()) newErrors.fathersOccupation = "Father&apos;s occupation is required";
      if (!formData.mothersName.trim()) newErrors.mothersName = "Mother&apos;s name is required";
      if (!formData.mothersOccupation.trim()) newErrors.mothersOccupation = "Mother&apos;s occupation is required";
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

    if (step === 6) {
      if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
      else if (formData.mobileNumber.length < 10) newErrors.mobileNumber = 'Mobile number must be at least 10 digits';
      if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email address is required';
      else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) newErrors.emailAddress = 'Email is invalid';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // If it's the last step, submit the form
      if (currentStep === 6) {
        try {
          await submitRegistration(formData, 'POST');
        } catch (error) {
          // Error is handled by the mutation hook's onError callback
          console.error('Registration failed:', error);
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

        {/* Name */}
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

        {/* Gender */}
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

        {/* Photo */}
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

        {/* Date of Birth */}
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

        {/* Place of Birth */}
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

        {/* Height */}
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

        {/* Complexion */}
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

        {/* Marital Status */}
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

        {/* Mother Tongue */}
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

        {/* Religion */}
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

        {/* Caste */}
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

        {/* Gotra */}
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
                label="Highest Qualification"
                type="select"
                value={formData.qualification}
                options={qualificationOptions || []}
                placeholder="Select qualification"
                onChange={handleSelectChange}
                error={errors.qualification}
              />

              <CustomFormField
                id="collegeUniversity"
                name="collegeUniversity"
                label="College / University"
                type="text"
                value={formData.collegeUniversity}
                placeholder="Enter college or university name"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.collegeUniversity}
              />

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

              <CustomFormField
                id="organisationBusiness"
                name="organisationBusiness"
                label="Organisation / Business"
                type="text"
                value={formData.organisationBusiness}
                placeholder="Enter organisation or business name"
                onChange={handleSelectChange}
                onTextChange={handleChange}
                error={errors.organisationBusiness}
              />

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
                id="city"
                name="city"
                label="City"
                type="select"
                value={formData.city}
                options={cityOptions || []}
                placeholder="Select city"
                onChange={handleSelectChange}
                error={errors.city}
              />

              <CustomFormField
                id="state"
                name="state"
                label="State"
                type="select"
                value={formData.state}
                options={availableStateOptions}
                placeholder={formData.city ? "Select state" : "Select city first"}
                onChange={handleSelectChange}
                disabled={!formData.city || loadingStatesByCity}
                error={errors.state}
              />
            </div>
            {!formData.city && (
              <p className="mt-2 text-xs text-gray-500">Please select city first to filter states</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lifestyle</h2>
            
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
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Details</h2>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-3">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                An active email ID & phone no. are required to secure your Profile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="mobileNumber" className="block text-sm font-bold text-gray-900 mb-2">
                  Mobile Number:
                </label>
                <div className="flex gap-2 items-center">
                  <div className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 font-medium">
                    +91
                  </div>
                  <div className="flex-1">
                    <input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="text"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Mobile no."
                      maxLength={15}
                      className={`w-full px-3 py-3 border ${
                        errors.mobileNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-r-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300`}
                    />
                  </div>
                </div>
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="emailAddress"
                  name="emailAddress"
                  label="Email Address"
                  type="email"
                  value={formData.emailAddress}
                  placeholder="Email Address"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.emailAddress}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <CustomFormField
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  placeholder="Create a password (min. 6 characters)"
                  onChange={handleSelectChange}
                  onTextChange={handleChange}
                  error={errors.password}
                />
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
    if (step === 6) {
      return !!(
        formData.mobileNumber.trim() &&
        formData.mobileNumber.length >= 10 &&
        formData.emailAddress.trim() &&
        /\S+@\S+\.\S+/.test(formData.emailAddress) &&
        formData.password.trim() &&
        formData.password.length >= 6
      );
    }
    return false;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8 relative">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-colors z-10"
              disabled={currentStep === 1}
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
            </button>

            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      step <= currentStep ? 'bg-rose-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-gray-600">
                Step {currentStep} of 6
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
                  <p className="text-sm text-red-600">{submitError.message || 'Failed to submit registration. Please try again.'}</p>
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
                    Submitting...
                  </span>
                ) : (
                  currentStep === 6 ? 'Submit' : 'Continue'
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                By creating account, you agree to our{' '}
                <Link href="/privacy" className="text-blue-500 hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" className="text-blue-500 hover:underline">
                  T&C.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
