import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/operations/authAPI';

const Navbar = () => {
    const { token, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        dispatch(logout(navigate));
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                                <i className="fas fa-code text-blue-600 text-2xl mr-2"></i>
                                <span className="text-xl font-bold text-gray-900">CodeCollab</span>
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {token ? (
                            <>
                                <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/profile" 
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                                >
                                    Sign out
                                </button>
                                <div className="ml-2 flex items-center">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                        {user?.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/features" className="hidden md:block text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                                    Features
                                </Link>
                                <Link to="/pricing" className="hidden md:block text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                                    Pricing
                                </Link>
                                <Link to="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                                    Log in
                                </Link>
                                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;