import React, { useEffect } from 'react';
import { Button, Typography, Box, Container, Grid, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ClockIcon from '@mui/icons-material/AccessTime';

const LandingPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { subscription } = useSubscription();

  const isAuthenticated = Boolean(subscription);

  const renderFreePlanButton = () => {
    if (!isAuthenticated) {
      return (
        <button 
          onClick={() => navigate('/login')}
          className="w-full mt-4 py-2 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                     rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 
                     font-medium shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
        >
          Get Started
        </button>
      );
    }

    if (subscription?.plan_type === 'pro') {
      return (
        <p className="mt-4 text-gray-900 dark:text-white font-medium">
          Current Plan
        </p>
      );
    }

    return (
      <button 
        onClick={() => navigate('/generate')}
        className="w-full mt-4 py-2 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                   rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 
                   font-medium shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
      >
        Start Generating
      </button>
    );
  };

  const renderProPlanButton = () => {
    if (!isAuthenticated) {
      return (
        <button 
          onClick={() => navigate('/login')}
          className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg 
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 
                   font-medium shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
        >
          Get Pro Access
        </button>
      );
    }

    if (subscription?.plan_type === 'pro') {
      return (
        <p className="mt-4 text-gray-900 dark:text-white font-medium text-center">
          Current Plan
        </p>
      );
    }

    return (
      <button 
        onClick={handleUpgrade}
        className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg 
                 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 
                 font-medium shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
      >
        Upgrade to Pro
      </button>
    );
  };

  const handleUpgrade = async () => {
    console.log('handleUpgrade called');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (!session) {
        throw new Error('No active session');
      }

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
        console.log('Redirecting to Stripe:', url);
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text 
                       bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 mb-8
                       leading-[1.2] pb-2" >
            PageCrafter AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-medium">
            Create SEO-optimized web content in minutes, not hours
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-12">
            Transform your ideas into professionally crafted, search-engine ready articles with minimal input. Perfect for content creators, marketers, and businesses.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mb-20">
            <Button
              onClick={() => navigate('/generate')}
              className="px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                       transition-all duration-200 text-lg font-medium"
            >
              Try For Free
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="px-8 py-3 text-blue-600 border-2 border-blue-600 rounded-lg 
                       hover:bg-blue-50 transition-all duration-200 text-lg font-medium"
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Features Section - directly after hero */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <ArticleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Content Generation</h3>
            <p className="text-gray-600">Generate complete, SEO-optimized articles in minutes with just a few key details.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <EditIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Full Editorial Control</h3>
            <p className="text-gray-600">Edit and refine your generated content directly on the platform before downloading.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <SearchIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">SEO Optimized</h3>
            <p className="text-gray-600">Every article is structured for maximum search engine visibility and ranking potential.</p>
          </div>
        </div>

        {/* Value Metrics Section */}
        <div className="text-center mb-20">
          <h3 className="text-2xl font-bold text-gray-800 mb-12">Why Choose PageCrafter AI?</h3>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 mb-4">
                <ClockIcon className="h-8 w-8 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">5 Minute Setup</h4>
              <p className="text-gray-600">From idea to complete article in under 5 minutes. No writing experience needed.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 mb-4">
                <SearchIcon className="h-8 w-8 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Built-in SEO</h4>
              <p className="text-gray-600">Automatic keyword optimization and meta descriptions for better search rankings.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-blue-600 mb-4">
                <EditIcon className="h-8 w-8 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Full Control</h4>
              <p className="text-gray-600">Edit and customize your content directly in our built-in editor before downloading.</p>
            </div>
          </div>
        </div>



        {/* Pricing Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-800">
            Choose Your Plan
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-white rounded-2xl shadow-lg p-8 
                          border border-gray-100
                          hover:shadow-xl transition-all duration-300
                          group">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
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

            {/* Pro Plan */}
            <div className="relative bg-white rounded-2xl p-8 
                          border-2 border-blue-500
                          shadow-lg hover:shadow-xl 
                          transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
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
      </div>
    </div>
  );
};


export default LandingPage;