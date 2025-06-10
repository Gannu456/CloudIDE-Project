// components/Common/ProtectedHomeRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedHomeRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  // If logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedHomeRoute;