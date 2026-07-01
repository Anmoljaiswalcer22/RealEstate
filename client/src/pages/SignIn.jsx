import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import OAuth from '../components/OAuth';
import { ErrorMessage, SuccessMessage } from '../components/Status';
import { setUser } from '../redux/user/userSlice';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api('/api/auth/signin', { method: 'POST', body: form });
      dispatch(setUser(user));
      navigate(location.state?.from || '/', { replace: true }); // back to the page they wanted
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Sign In</h1>
      <div className="mb-4">
        <SuccessMessage>{location.state?.message}</SuccessMessage>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput id="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <FormInput
          id="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
        <OAuth />
      </form>
      <div className="flex gap-2 mt-5">
        <p>Don&apos;t have an account?</p>
        <Link to="/sign-up" className="text-blue-700">
          Sign up
        </Link>
      </div>
      <div className="mt-5">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    </main>
  );
}
