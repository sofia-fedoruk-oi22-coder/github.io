const localhostApiUrl = 'http://localhost:5000';

export const API_BASE_URL = process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined'
    && window.location
    && window.location.hostname
    && window.location.hostname.includes('localhost')
    ? localhostApiUrl
    : '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
