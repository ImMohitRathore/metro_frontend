'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Plan {
  _id: string;
  name: string;
  duration: number; // Duration in months
  price: number; // Price in INR
  description?: string;
  features: string[];
  isActive: boolean;
}

interface Subscription {
  _id: string;
  userId: string;
  planId: Plan;
  status: string;
  startDate: string;
  endDate: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (user?.id) {
      fetchCurrentSubscription();
    }
  }, [user?.id]);

  const fetchPlans = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Plan[] }>('/api/plans');
      if (response.success && response.data) {
        // Backend returns { success: true, data: Plan[] }
        const plansData = Array.isArray(response.data) ? response.data : [];
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Subscription | null }>(`/api/subscriptions/user/${user?.id}`);
      if (response.success && response.data) {
        setCurrentSubscription(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleBuyPlan = async (planId: string) => {
    if (!user?.id) {
      alert('Please login to purchase a plan');
      return;
    }

    try {
      setProcessingPlan(planId);

      // Create payment order
      const orderResponse = await api.post<{
        paymentId: string;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        isDummyMode?: boolean;
      }>('/api/payments/order', {
        userId: user.id,
        planId,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount, keyId, paymentId, isDummyMode } = orderResponse.data;

      // If in dummy mode, simulate payment success directly
      if (isDummyMode) {
        try {
          // Simulate payment verification with dummy data
          const verifyResponse = await api.post('/api/payments/verify', {
            paymentId,
            razorpayOrderId: orderId,
            razorpayPaymentId: `pay_dummy_${Date.now()}`,
            razorpaySignature: `sig_dummy_${Date.now()}`,
          });

          if (verifyResponse.success) {
            alert('✅ Payment successful! (Test Mode - Payment was simulated)');
            await fetchCurrentSubscription();
            router.push('/profiles');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          alert('Error verifying payment. Please contact support.');
        } finally {
          setProcessingPlan(null);
        }
        return;
      }

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const razorpay = new window.Razorpay({
          key: keyId,
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          name: 'Matrimony App',
          description: 'Subscription Plan',
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await api.post('/api/payments/verify', {
                paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyResponse.success) {
                alert('Payment successful! Your subscription is now active.');
                // Refresh subscription status
                await fetchCurrentSubscription();
                // Redirect to profiles
                router.push('/profiles');
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              alert('Error verifying payment. Please contact support.');
            } finally {
              setProcessingPlan(null);
            }
          },
          prefill: {
            name: user.name || '',
            email: user.emailAddress || '',
            contact: user.mobileNumber || '',
          },
          theme: {
            color: '#e11d48', // Rose color
          },
          modal: {
            ondismiss: function() {
              setProcessingPlan(null);
            },
          },
        });

        razorpay.open();
        razorpay.on('payment.failed', function (response: any) {
          alert('Payment failed. Please try again.');
          setProcessingPlan(null);
        });
      };
      script.onerror = () => {
        alert('Failed to load payment gateway. Please try again.');
        setProcessingPlan(null);
      };
      document.body.appendChild(script);
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
      setProcessingPlan(null);
    }
  };

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
              <p className="text-gray-600">Loading plans...</p>
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
          <div className="mb-8">
            <Link
              href="/profiles"
              className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-4 transition-colors"
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
              Back to Profiles
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600 mt-2">
              Choose a plan to view unlimited profiles and connect with more matches
            </p>
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ✅ Active Subscription
                  </h3>
                  <p className="text-green-700">
                    Plan: {currentSubscription.planId?.name || 'N/A'}
                  </p>
                  <p className="text-green-700 text-sm">
                    Valid until: {new Date(currentSubscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href="/profiles"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Profiles
                </Link>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.planId?._id === plan._id;
              const isProcessing = processingPlan === plan._id;

              return (
                <div
                  key={plan._id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    plan.duration === 3 ? 'border-4 border-rose-500 transform scale-105' : ''
                  }`}
                >
                  {plan.duration === 3 && (
                    <div className="bg-rose-500 text-white text-center py-2 font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                    )}
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-rose-600">₹{plan.price}</span>
                      <span className="text-gray-600">/{plan.duration} month{plan.duration > 1 ? 's' : ''}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyPlan(plan._id)}
                        disabled={isProcessing}
                        className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                          plan.duration === 3
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5"
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
                            Processing...
                          </span>
                        ) : (
                          'Buy Now'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No subscription plans available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
