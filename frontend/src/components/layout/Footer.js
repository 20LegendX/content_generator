import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-6">
      <div className="container mx-auto px-4 text-center">
        <nav className="mb-4">
          <Link to="/privacy-policy" className="mx-2 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="mx-2 hover:underline">
            Terms and Conditions
          </Link>
          <a href="mailto:support@pagecrafter.ai" className="mx-2 hover:underline">
            Contact Us
          </a>
        </nav>
        <p className="text-sm">&copy; {new Date().getFullYear()} PageCrafter AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
