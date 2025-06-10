const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Loading your workspace...</p>
      </div>
    </div>
  );
  
  export default LoadingScreen;