const getApiUrl = () => {
    // During development, read from the console output which port the Flask app is using
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
};

export const config = {
    apiUrl: getApiUrl(),
    // other config...
};

export default config;