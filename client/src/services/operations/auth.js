import { setToken, setUser } from '../../slices/authSlice';
import { apiConnector } from '../apiConnector';
import apis from '../apis';

export async function loadUser(dispatch) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await apiConnector('GET', apis.LOAD_USER_API, null, {
      Authorization: `Bearer ${token}`,
    });
    
    if (response.data.success) {
      dispatch(setToken(token));
      dispatch(setUser(response.data.user));
    }
  } catch (error) {
    console.error('LOAD USER ERROR:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}