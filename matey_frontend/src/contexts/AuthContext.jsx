import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Add interceptor to add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Checking token:', token ? 'Token exists' : 'No token');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Token decoded:', decoded);
        console.log('Token expiration:', new Date(decoded.exp * 1000));
        console.log('Current time:', new Date());
        
        if (decoded.exp * 1000 > Date.now()) {
          console.log('Token is valid');
          return true;
        } else {
          console.log('Token is expired');
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    }
    console.log('Token is invalid or missing');
    return false;
  };

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/api/users/me');
      console.log('User profile received:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication...');
      const isValid = checkToken();
      console.log('Token validation result:', isValid);
      
      if (isValid) {
        const profileFetched = await fetchUserProfile();
        console.log('Profile fetch result:', profileFetched);
        if (!profileFetched) {
          console.log('Failed to fetch profile, clearing auth state');
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      } else {
        console.log('Invalid token, clearing auth state');
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (emailOrUsername, password, remember = false) => {
    try {
      console.log('Attempting login...');
      const response = await api.post('/api/auth/signin', {
        emailOrUsername,
        password,
      });
      const { token } = response.data;
      console.log('Login successful, storing token');
      
      // Store token based on remember me preference
      if (remember) {
        console.log('Storing token in localStorage');
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token');
      } else {
        console.log('Storing token in sessionStorage');
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token');
      }
      
      const profileFetched = await fetchUserProfile();
      console.log('Profile fetch after login:', profileFetched);
      return profileFetched;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration...');
      const response = await api.post('/api/auth/signup', {
        username,
        email,
        password,
      });
      console.log('Registration successful');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log('Logging out, clearing auth state');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/users/me', profileData);
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/users/me/password', {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 