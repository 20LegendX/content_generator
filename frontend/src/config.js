// Export the function
const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';
};

// Export the API_BASE_URL constant
const API_BASE_URL = getApiUrl();

// Export everything we need
export { API_BASE_URL };

// Export the default config object
const config = {
    apiUrl: API_BASE_URL,
};

export default config;