const Navbar = () => {
    return (
      <nav className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <a href="https://dynamodefi.com" className="flex items-center text-gray-700 hover:text-blue-500">
                Home
              </a>
              <a href="https://dashboard.dynamodefi.com" className="flex items-center ml-8 text-gray-700 hover:text-blue-500">
                DeFi Dashboard
              </a>
              <a href="https://dynamodefi.substack.com" className="flex items-center ml-8 text-gray-700 hover:text-blue-500">
                Newsletter
              </a>
            </div>
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;