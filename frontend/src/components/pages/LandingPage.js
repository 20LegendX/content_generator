import React, { useEffect } from 'react';
import { Button, Typography, Box, Container, Grid, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-600 dark:text-white mb-6">
          PageCrafter AI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-200 max-w-2xl mx-auto mb-12">
          Generate professional articles, match reports, and scout reports instantly with AI
        </p>

        <div className="mt-16">
          <h2 className="text-3xl font-semibold mb-8 text-primary-600 dark:text-white">
            Choose Your Plan
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 
                          border border-gray-200 dark:border-gray-700
                          hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Free Plan
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                £0
              </p>
              <ul className="space-y-4 mb-8 text-left text-gray-700 dark:text-gray-200">
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>3 Articles per month</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>Basic templates</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>Standard support</span>
                </li>
              </ul>
              {renderFreePlanButton()}
            </div>

            {/* Pro Plan */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 
                          border-2 border-primary-600 dark:border-white
                          hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Pro Plan
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                £19<span className="text-lg text-gray-600 dark:text-gray-200">/mo</span>
              </p>
              <ul className="space-y-4 mb-8 text-left text-gray-700 dark:text-gray-200">
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>50 Articles per month</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>All Premium Templates</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="text-green-500 dark:text-green-400 mr-3" />
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