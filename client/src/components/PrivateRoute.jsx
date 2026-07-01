import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// UX only: hides protected pages from logged-out users.
// Real security is the verifyToken middleware on the backend.
export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  return currentUser ? <Outlet /> : <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
}
