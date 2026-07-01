import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import ListingCard from '../components/ListingCard';
import { ErrorMessage, SuccessMessage } from '../components/Status';
import { setUser, signOutSuccess } from '../redux/user/userSlice';
import { uploadImage, validateImageFile } from '../utils/uploadImages';

export default function Profile() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    username: currentUser.username,
    email: currentUser.email,
    password: '',
    avatar: currentUser.avatar,
  });
  const [avatarProgress, setAvatarProgress] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [listings, setListings] = useState(null);
  const [listingsError, setListingsError] = useState('');

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError('');
    const problem = validateImageFile(file);
    if (problem) return setAvatarError(problem);
    setAvatarProgress(0);
    try {
      const url = await uploadImage(file, setAvatarProgress);
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarProgress(null);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password && form.password.length < 6) return setError('Password must be at least 6 characters');

    const body = { username: form.username, email: form.email, avatar: form.avatar };
    if (form.password) body.password = form.password;

    setLoading(true);
    try {
      const user = await api(`/api/user/update/${currentUser._id}`, { method: 'POST', body });
      dispatch(setUser(user));
      setForm((prev) => ({ ...prev, password: '' }));
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return setConfirmDelete(true); // two-step confirmation
    try {
      await api(`/api/user/delete/${currentUser._id}`, { method: 'DELETE' });
      dispatch(signOutSuccess());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await api('/api/auth/signout');
    } finally {
      dispatch(signOutSuccess()); // clear the UI even if the request fails
    }
  };

  const handleShowListings = async () => {
    setListingsError('');
    try {
      setListings(await api(`/api/user/listings/${currentUser._id}`));
    } catch (err) {
      setListingsError(err.message);
    }
  };

  const handleDeleteListing = async (id) => {
    try {
      await api(`/api/listing/delete/${id}`, { method: 'DELETE' });
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setListingsError(err.message);
    }
  };

  return (
    <main className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <button type="button" onClick={() => fileRef.current.click()} className="self-center" aria-label="Change profile picture">
          <img
            src={form.avatar}
            alt="Profile"
            referrerPolicy="no-referrer"
            className="rounded-full h-24 w-24 object-cover hover:opacity-80"
          />
        </button>
        <p className="text-sm text-center">
          {avatarProgress !== null ? (
            <span className="text-slate-700">Uploading {avatarProgress}%</span>
          ) : avatarError ? (
            <span className="text-red-700">{avatarError}</span>
          ) : (
            <span className="text-slate-500">Click the picture to change it</span>
          )}
        </p>

        <FormInput id="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <FormInput id="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <FormInput
          id="password"
          type="password"
          placeholder="New password (leave empty to keep)"
          value={form.password}
          onChange={handleChange}
        />
        <Button type="submit" loading={loading} disabled={avatarProgress !== null}>
          Update
        </Button>
        <Link to="/create-listing" className="bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95">
          Create listing
        </Link>
      </form>

      <div className="flex justify-between mt-5">
        <button type="button" onClick={handleDeleteAccount} className="text-red-700">
          {confirmDelete ? 'Click again to permanently delete' : 'Delete account'}
        </button>
        <button type="button" onClick={handleSignOut} className="text-red-700">
          Sign out
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <ErrorMessage>{error}</ErrorMessage>
        <SuccessMessage>{success}</SuccessMessage>
      </div>

      <button type="button" onClick={handleShowListings} className="text-green-700 w-full mt-5">
        Show my listings
      </button>
      <ErrorMessage>{listingsError}</ErrorMessage>

      {listings && listings.length === 0 && <p className="text-center text-slate-600 mt-3">You have no listings yet.</p>}
      {listings && listings.length > 0 && (
        <section className="flex flex-col gap-4 mt-5">
          <h2 className="text-center text-2xl font-semibold">Your listings</h2>
          {listings.map((listing) => (
            <div key={listing._id} className="flex flex-col gap-2">
              <ListingCard listing={listing} />
              <div className="flex gap-4 justify-end">
                <Link to={`/update-listing/${listing._id}`} className="text-green-700 uppercase text-sm">
                  Edit
                </Link>
                <button type="button" onClick={() => handleDeleteListing(listing._id)} className="text-red-700 uppercase text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
