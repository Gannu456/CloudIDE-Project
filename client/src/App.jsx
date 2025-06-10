import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import NavBar from "./components/Common/NavBar";
import HomePage from "./pages/HomePage";
import SignUpForm from "./components/Core/Auth/SignUpForm";
import LoginForm from "./components/Core/Auth/LoginForm";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import ProtectedRoute from "./components/Core/Auth/ProtectedRoute";
import ProtectedHomeRoute from "./components/Core/Auth/ProtectedHomePage";
import IDE from "./components/Core/IDE/IDE";
import Classroom from "./components/Core/IDE/Classroom";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Layout component that conditionally renders Navbar
const Layout = ({ children }) => {
  const location = useLocation();
  const showNavbar = !(location.pathname.startsWith("/ide") || location.pathname.startsWith("/classroom"));
  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <NavBar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedHomeRoute>
                <HomePage />
              </ProtectedHomeRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <ProtectedHomeRoute>
                <SignUpForm />
              </ProtectedHomeRoute>
            }
          />

          <Route
            path="/features"
            element={
              <ProtectedHomeRoute>
                <Features />
              </ProtectedHomeRoute>
            }
          />

          <Route
            path="/login"
            element={
              <ProtectedHomeRoute>
                <LoginForm />
              </ProtectedHomeRoute>
            }
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ide" element={<IDE />} />
            <Route path="/classroom/:roomId" element={<Classroom />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
