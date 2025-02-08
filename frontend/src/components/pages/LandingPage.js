import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ClockIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const isAuthenticated = Boolean(subscription);

  const handleUpgrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  const renderFreePlanButton = () => {
    if (!isAuthenticated) {
      return (
        <Button
          onClick={() => navigate('/login')}
          variant="contained"
          color="primary"
          size="large"
          className="w-full mt-4"
        >
          Get Started
        </Button>
      );
    }
    if (subscription?.plan_type === 'pro') {
      return (
        <span className="mt-4 text-gray-900 font-semibold">Current Plan</span>
      );
    }
    return (
      <Button
        onClick={() => navigate('/generate')}
        variant="contained"
        color="primary"
        size="large"
        className="w-full mt-4"
      >
        Start Generating
      </Button>
    );
  };

  const renderProPlanButton = () => {
    if (!isAuthenticated) {
      return (
        <Button
          onClick={() => navigate('/login')}
          variant="contained"
          color="primary"
          size="large"
          className="w-full"
        >
          Get Pro Access
        </Button>
      );
    }
    if (subscription?.plan_type === 'pro') {
      return (
        <span className="mt-4 text-gray-900 font-semibold">Current Plan</span>
      );
    }
    return (
      <Button
        onClick={handleUpgrade}
        variant="contained"
        color="primary"
        size="large"
        className="w-full"
      >
        Upgrade to Pro
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-transparent bg-clip-text mb-6 leading-tight">
          PageCrafter AI
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Create SEO-optimized web content in minutes, not hours
        </p>
        <p className="max-w-2xl mx-auto text-lg text-gray-500 mb-12">
          Transform your ideas into professionally crafted, search-engine ready articles with minimal input.
          Perfect for content creators, marketers, and businesses.
        </p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => navigate('/generate')}
            variant="contained"
            color="primary"
            size="large"
            className="px-8 py-3 text-lg"
          >
            Try For Free
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="outlined"
            color="primary"
            size="large"
            className="px-8 py-3 text-lg"
          >
            See How It Works
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <ArticleIcon className="text-blue-600" fontSize="large" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Instant Content Generation
              </h3>
              <p className="text-gray-600 text-center">
                Generate complete, SEO-optimized articles in minutes with just a few key details.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <EditIcon className="text-blue-600" fontSize="large" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Full Editorial Control
              </h3>
              <p className="text-gray-600 text-center">
                Edit and refine your generated content directly on the platform before downloading.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <SearchIcon className="text-blue-600" fontSize="large" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                SEO Optimized
              </h3>
              <p className="text-gray-600 text-center">
                Every article is structured for maximum search engine visibility and ranking potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Metrics Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">
            Why Choose PageCrafter AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="mb-4 text-blue-600">
                <ClockIcon fontSize="large" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                5 Minute Setup
              </h4>
              <p className="text-gray-600">
                From idea to complete article in under 5 minutes. No writing experience needed.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="mb-4 text-blue-600">
                <SearchIcon fontSize="large" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Built-in SEO
              </h4>
              <p className="text-gray-600">
                Automatic keyword optimization and meta descriptions for better search rankings.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-shadow duration-300">
              <div className="mb-4 text-blue-600">
                <EditIcon fontSize="large" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Full Control
              </h4>
              <p className="text-gray-600">
                Edit and customize your content directly in our built-in editor before downloading.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-16">
            Choose Your Plan
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan Card */}
            <div className="relative bg-white rounded-2xl shadow hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Free Plan
              </h3>
              <p className="text-4xl font-bold text-gray-800 mb-6">
                £0
              </p>
              <ul className="space-y-4 mb-8 text-left text-gray-600">
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>3 Articles per month</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>Basic templates</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>Standard support</span>
                </li>
              </ul>
              {renderFreePlanButton()}
            </div>

            {/* Pro Plan Card */}
            <div className="relative bg-white rounded-2xl shadow hover:shadow-xl transition-shadow duration-300 p-8 border-2 border-blue-500">
              {/* “Popular” Badge */}
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-sm">
                Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Pro Plan
              </h3>
              <p className="text-4xl font-bold text-gray-800 mb-6">
                £19<span className="text-lg text-gray-500 font-medium">/mo</span>
              </p>
              <ul className="space-y-4 mb-8 text-left text-gray-600">
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>50 Articles per month</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>All Premium Templates</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-blue-500 mr-3" />
                  <span>Advanced Features</span>
                </li>
              </ul>
              {renderProPlanButton()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
