import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import OAuth from '../components/OAuth';
import { ErrorMessage } from '../components/Status';

export default function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Instant frontend feedback (the backend validates again)
    if (form.username.trim().length < 3) return setError('Username must be at least 3 characters');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      await api('/api/auth/signup', { method: 'POST', body: form });
      navigate('/sign-in', { state: { message: 'Account created. Please sign in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput id="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <FormInput id="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <FormInput
          id="password"
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" loading={loading}>
          Sign up
        </Button>
        <OAuth />
      </form>
      <div className="flex gap-2 mt-5">
        <p>Have an account?</p>
        <Link to="/sign-in" className="text-blue-700">
          Sign in
        </Link>
      </div>
      <div className="mt-5">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    </main>
  );
}
