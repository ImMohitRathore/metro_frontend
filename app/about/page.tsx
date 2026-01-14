import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Matrimony, your trusted partner in finding meaningful relationships. 
              We understand that finding the right life partner is one of the most important 
              decisions in your life, and we're here to make that journey easier and more 
              successful.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-6">
              Our mission is to help individuals find their perfect life partners through 
              a secure, user-friendly, and effective platform. We believe in creating 
              meaningful connections that lead to lasting relationships.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Why Choose Us?</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Verified profiles to ensure authenticity and safety</li>
              <li>Advanced matching algorithm based on compatibility</li>
              <li>Secure and private communication platform</li>
              <li>User-friendly interface for easy navigation</li>
              <li>24/7 customer support to assist you</li>
              <li>Thousands of success stories from happy couples</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How It Works</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Create Your Profile</h3>
                  <p className="text-gray-700">Sign up and create a detailed profile with your information and preferences</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Browse Matches</h3>
                  <p className="text-gray-700">Explore profiles that match your criteria and preferences</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Connect & Chat</h3>
                  <p className="text-gray-700">Send interests and start conversations with potential matches</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Find Your Match</h3>
                  <p className="text-gray-700">Build meaningful connections and find your perfect life partner</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-6">
              Have questions or need assistance? Our support team is here to help you 24/7. 
              Feel free to reach out to us anytime.
            </p>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                href="/register"
                className="inline-block bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors"
              >
                Join Us Today
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
