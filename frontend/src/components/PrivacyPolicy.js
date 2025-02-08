import React, { useEffect } from 'react';



const PrivacyPolicy = () => {
  useEffect(() => {
    // Add the GetTerms script dynamically
    const scriptId = 'getterms-embed-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.getterms.io/dist/js/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []); // Run only once when the component mounts

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      {/* Embed container */}
      <div
        className="getterms-document-embed"
        data-getterms="kkJcR" // Replace with your unique GetTerms ID
        data-getterms-document="privacy"
        data-getterms-lang="en-au"
        data-getterms-mode="direct"
      ></div>
    </div>
  );
};

export default PrivacyPolicy;
