import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

const navClass = ({ isActive }) =>
  `hidden sm:inline hover:underline ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-700'}`;

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the header search box in sync with the URL (?searchTerm=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('searchTerm') || '');
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.pathname === '/search' ? location.search : '');
    params.set('searchTerm', searchTerm.trim());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <header className="bg-slate-200 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto p-3 gap-3">
        <Link to="/" className="font-bold text-sm sm:text-xl flex flex-wrap">
          <span className="text-slate-500">FullStack</span>
          <span className="text-slate-700">Estate</span>
        </Link>

        <form onSubmit={handleSubmit} className="bg-slate-100 p-2 sm:p-3 rounded-lg flex items-center">
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search listings"
            className="bg-transparent focus:outline-none w-24 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" aria-label="Search">
            <FaSearch className="text-slate-600" />
          </button>
        </form>

        <nav className="flex items-center gap-4">
          <NavLink to="/" className={navClass} end>
            Home
          </NavLink>
          <NavLink to="/search" className={navClass}>
            Browse
          </NavLink>
          {currentUser && (
            <NavLink to="/my-bookings" className={navClass}>
              Bookings
            </NavLink>
          )}
          {currentUser ? (
            <Link to="/profile">
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="rounded-full h-8 w-8 object-cover"
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <Link to="/sign-in" className="text-slate-700 hover:underline">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
