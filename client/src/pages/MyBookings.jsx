import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { ErrorMessage, Loader } from '../components/Status';
import { formatDate } from '../utils/format';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-200 text-slate-600',
};

const TABS = [
  { key: 'user', label: 'My booking requests' },
  { key: 'owner', label: 'Requests on my listings' },
];

function BookingRow({ booking, asOwner, onStatusChange }) {
  const listing = booking.listingId;
  const active = booking.status !== 'cancelled';

  return (
    <li className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4">
      {listing ? (
        <Link to={`/listing/${listing._id}`} className="shrink-0">
          <img src={listing.imageUrls[0]} alt={listing.name} className="h-24 w-32 object-cover rounded" />
        </Link>
      ) : (
        <div className="h-24 w-32 bg-slate-200 rounded flex items-center justify-center text-xs">Listing removed</div>
      )}
      <div className="flex-1 flex flex-col gap-1">
        <p className="font-semibold">{listing?.name || 'Deleted listing'}</p>
        <p className="text-sm text-slate-600">{listing?.address}</p>
        <p className="text-sm">
          Visit on <span className="font-semibold">{formatDate(booking.visitDate)}</span>
          {asOwner && booking.userId && (
            <>
              {' '}
              by <span className="font-semibold">{booking.userId.username}</span> ({booking.userId.email})
            </>
          )}
        </p>
        {booking.message && <p className="text-sm text-slate-600 italic">&ldquo;{booking.message}&rdquo;</p>}
      </div>
      <div className="flex sm:flex-col items-end gap-2">
        <span className={`text-xs uppercase font-semibold px-2 py-1 rounded ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
        {asOwner && booking.status === 'pending' && (
          <button type="button" onClick={() => onStatusChange(booking._id, 'confirmed')} className="text-green-700 text-sm uppercase">
            Confirm
          </button>
        )}
        {active && (
          <button type="button" onClick={() => onStatusChange(booking._id, 'cancelled')} className="text-red-700 text-sm uppercase">
            Cancel
          </button>
        )}
      </div>
    </li>
  );
}

export default function MyBookings() {
  const [tab, setTab] = useState('user');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    api(`/api/booking/${tab}`)
      .then((data) => !ignore && setBookings(data))
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [tab]);

  const handleStatusChange = async (id, status) => {
    setError('');
    try {
      const updated = await api(`/api/booking/${id}/status`, { method: 'PATCH', body: { status } });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: updated.status } : b)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-3">
      <h1 className="text-3xl font-semibold text-center my-7">Bookings</h1>
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 -mb-px border-b-2 ${tab === t.key ? 'border-slate-700 font-semibold' : 'border-transparent text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <p className="text-slate-600">
          {tab === 'user' ? (
            <>
              No bookings yet.{' '}
              <Link to="/search" className="text-blue-700 hover:underline">
                Browse properties
              </Link>
            </>
          ) : (
            'Nobody has booked your listings yet.'
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((b) => (
            <BookingRow key={b._id} booking={b} asOwner={tab === 'owner'} onStatusChange={handleStatusChange} />
          ))}
        </ul>
      )}
    </main>
  );
}
