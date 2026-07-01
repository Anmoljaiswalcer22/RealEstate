import { Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Search from './pages/Search';
import Listing from './pages/Listing';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import MyBookings from './pages/MyBookings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:listingId" element={<Listing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected pages: PrivateRoute redirects logged-out users (UX only; the API enforces security) */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/update-listing/:listingId" element={<CreateListing />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
