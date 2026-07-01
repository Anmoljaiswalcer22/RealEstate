import { useEffect, useState } from 'react';
import { FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import ImageSlider from '../components/ImageSlider';
import { ErrorMessage, Loader, SuccessMessage } from '../components/Status';
import { formatPrice } from '../utils/format';

// Local date (YYYY-MM-DD) for tomorrow, used as the date picker's minimum
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Send midday in the user's own time zone so the date never shifts to the previous day
const toVisitDateISO = (yyyyMmDd) => new Date(`${yyyyMmDd}T12:00:00`).toISOString();

function BookingForm({ listingId }) {
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api('/api/booking/create', { method: 'POST', body: { listingId, visitDate: toVisitDateISO(visitDate), message } });
      setSuccess('Booking request sent! Track it on the Bookings page.');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow">
      <h2 className="font-semibold text-lg">Book a visit</h2>
      <FormInput
        id="visitDate"
        label="Visit date"
        type="date"
        min={tomorrow()}
        value={visitDate}
        onChange={(e) => setVisitDate(e.target.value)}
        required
      />
      <FormInput
        id="message"
        as="textarea"
        label="Message to the owner (optional)"
        rows={3}
        maxLength={500}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" variant="success" loading={loading}>
        Request booking
      </Button>
      <ErrorMessage>{error}</ErrorMessage>
      <SuccessMessage>{success}</SuccessMessage>
      {success && (
        <Link to="/my-bookings" className="text-blue-700 text-sm hover:underline">
          Go to my bookings
        </Link>
      )}
    </form>
  );
}

function ContactOwner({ ownerId, listingName }) {
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState('');

  const loadOwner = async () => {
    try {
      setOwner(await api(`/api/user/${ownerId}`));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!owner) {
    return (
      <>
        <Button type="button" variant="outline" onClick={loadOwner}>
          Contact owner
        </Button>
        <ErrorMessage>{error}</ErrorMessage>
      </>
    );
  }

  return (
    <p className="bg-white p-4 rounded-lg shadow">
      Contact <span className="font-semibold">{owner.username}</span> at{' '}
      <a className="text-blue-700 underline" href={`mailto:${owner.email}?subject=${encodeURIComponent(`Regarding ${listingName}`)}`}>
        {owner.email}
      </a>
    </p>
  );
}

export default function Listing() {
  const { listingId } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api(`/api/listing/get/${listingId}`)
      .then((data) => !ignore && setListing(data))
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [listingId]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="max-w-4xl mx-auto p-3 mt-7">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );

  const isOwner = currentUser && currentUser._id === listing.userRef;

  return (
    <main>
      <ImageSlider images={listing.imageUrls} alt={listing.name} />

      <div className="flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4">
        <h1 className="text-2xl font-semibold">
          {listing.name} - {formatPrice(listing.offer ? listing.discountPrice : listing.regularPrice)}
          {listing.type === 'rent' && ' / month'}
        </h1>
        <p className="flex items-center gap-2 text-slate-600 text-sm">
          <FaMapMarkerAlt className="text-green-700" />
          {listing.address}
        </p>
        <div className="flex gap-4">
          <span className="bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
            {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          {listing.offer && (
            <span className="bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
              {formatPrice(listing.regularPrice - listing.discountPrice)} OFF
            </span>
          )}
        </div>
        <p className="text-slate-800">
          <span className="font-semibold text-black">Description - </span>
          {listing.description}
        </p>
        <ul className="text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6">
          <li className="flex items-center gap-1">
            <FaBed className="text-lg" /> {listing.bedrooms > 1 ? `${listing.bedrooms} beds` : '1 bed'}
          </li>
          <li className="flex items-center gap-1">
            <FaBath className="text-lg" /> {listing.bathrooms > 1 ? `${listing.bathrooms} baths` : '1 bath'}
          </li>
          <li className="flex items-center gap-1">
            <FaParking className="text-lg" /> {listing.parking ? 'Parking spot' : 'No parking'}
          </li>
          <li className="flex items-center gap-1">
            <FaChair className="text-lg" /> {listing.furnished ? 'Furnished' : 'Unfurnished'}
          </li>
        </ul>

        {isOwner && (
          <Link to={`/update-listing/${listing._id}`} className="bg-green-700 text-white p-3 rounded-lg uppercase text-center">
            Edit this listing
          </Link>
        )}
        {currentUser && !isOwner && (
          <>
            <BookingForm listingId={listing._id} />
            <ContactOwner ownerId={listing.userRef} listingName={listing.name} />
          </>
        )}
        {!currentUser && (
          <p className="text-slate-600">
            <Link to="/sign-in" state={{ from: `/listing/${listing._id}` }} className="text-blue-700 hover:underline">
              Sign in
            </Link>{' '}
            to book a visit or contact the owner.
          </p>
        )}
      </div>
    </main>
  );
}
