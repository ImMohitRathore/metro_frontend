import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect Match
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of happy couples who found their life partners through our trusted matrimonial platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-rose-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-rose-700 transition-colors shadow-lg"
            >
              Create Free Profile
            </Link>
            <Link
              href="/about"
              className="border-2 border-rose-600 text-rose-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-rose-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Our advanced algorithm helps you find compatible matches based on your preferences
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your privacy is our priority. All profiles are verified and secure
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Easy Communication</h3>
            <p className="text-gray-600">
              Connect with matches through our secure messaging platform
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-rose-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Profiles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-600 mb-2">5K+</div>
              <div className="text-gray-600">Successful Matches</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-600 mb-2">98%</div>
              <div className="text-gray-600">Verified Profiles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Join us today and take the first step towards finding your life partner
        </p>
        <Link
          href="/register"
          className="inline-block bg-rose-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-rose-700 transition-colors shadow-lg"
        >
          Get Started Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Matrimony. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
