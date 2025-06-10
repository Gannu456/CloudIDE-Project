import { apiConnector } from '../apiConnector';
import apis from '../apis';
import { toast } from 'react-hot-toast';
import { setLoading, setToken, setUser, setlogout } from '../../slices/authSlice';
import { resetLoading } from '../../slices/loadingSlice';

export function signup(name, email, password, navigate) {
    return async (dispatch) => {
      dispatch(setLoading());
      try {
        console.log("Sending signup data:", { name, email, password });
        const response = await apiConnector('POST', apis.SIGNUP_API, {
          name,
          email,
          password,
        });
  
        console.log("Signup response:", response);
  
        // Handle successful signup
        if (response.data.token) {
          toast.success('Signup successful! Please login.');
          navigate('/login');
          return; // Exit early on success
        }
  
        // Handle cases where backend returns success=false
        if (response.data.success === false) {
          throw new Error(response.data.msg || 'Signup failed');
        }
  
        // Fallback error if no token and no success field
        throw new Error('Unexpected response from server');
        
      } catch (error) {
        console.error('SIGNUP API ERROR:', error);
        console.error('Error details:', error.response?.data);
        
        // Handle specific error cases
        if (error.response?.data?.msg === 'User already exists') {
          toast.error('This email is already registered. Please login instead.');
        } else {
          toast.error(
            error.response?.data?.message || 
            error.response?.data?.msg || 
            error.message || 
            'Signup failed'
          );
        }
      } finally {
        dispatch(resetLoading());
      }
    };
}

export function login(email, password, navigate) {
    return async (dispatch) => {
      dispatch(setLoading());
      try {
        const response = await apiConnector('POST', apis.LOGIN_API, {
          email,
          password,
        });
  
        // Success case - user logged in
        if (response.data.token) {
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            dispatch(setToken(response.data.token));
            dispatch(setUser(response.data.user));
            
            toast.success('Login successful! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 1500);
            return;
        }
  
        // Invalid credentials case
        if (response.data.msg === 'Invalid credentials') {
          toast.error('Invalid email or password', {
            duration: 4000,
            icon: '⚠️',
          });
          return;
        }
  
        // Other error cases
        throw new Error(response.data.msg || 'Login failed');
  
      } catch (error) {
        console.error('LOGIN ERROR:', error);
        
        if (error.response?.data?.msg) {
          toast.error(error.response.data.msg);
        } else {
          toast.error(error.message || 'An unexpected error occurred');
        }
      } finally {
        dispatch(resetLoading());
      }
    };
}

export function logout(navigate) {
    return (dispatch) => {
      dispatch(setlogout()); // Dispatch the logout action
      toast.success('Logged out successfully');
      navigate('/login');
    };
}