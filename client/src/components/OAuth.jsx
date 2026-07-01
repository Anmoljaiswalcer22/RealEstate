import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { app, isFirebaseConfigured } from '../firebase';
import { setUser } from '../redux/user/userSlice';
import Button from './Button';
import { ErrorMessage } from './Status';

export default function OAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!isFirebaseConfigured) {
    return <p className="text-xs text-slate-500 text-center">Google sign-in is off (add Firebase keys to client/.env).</p>;
  }

  const handleGoogleClick = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Firebase handles the Google popup + OAuth handshake
      const result = await signInWithPopup(getAuth(app), new GoogleAuthProvider());
      // 2. Send the Firebase ID token so the backend can VERIFY who this is
      const idToken = await result.user.getIdToken();
      // 3. Backend finds or creates the user and issues our own JWT cookies
      const user = await api('/api/auth/google', {
        method: 'POST',
        body: { name: result.user.displayName, email: result.user.email, photo: result.user.photoURL, idToken },
      });
      dispatch(setUser(user));
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="google" loading={loading} onClick={handleGoogleClick}>
        Continue with Google
      </Button>
      <ErrorMessage>{error}</ErrorMessage>
    </>
  );
}
