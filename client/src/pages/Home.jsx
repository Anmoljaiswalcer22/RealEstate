import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import ListingCard from '../components/ListingCard';
import { ErrorMessage, Loader } from '../components/Status';

const SECTIONS = [
  { key: 'offer', title: 'Recent offers', query: 'offer=true', more: '/search?offer=true' },
  { key: 'rent', title: 'Recent places for rent', query: 'type=rent', more: '/search?type=rent' },
  { key: 'sale', title: 'Recent places for sale', query: 'type=sale', more: '/search?type=sale' },
];

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    Promise.all(SECTIONS.map((s) => api(`/api/listing/get?${s.query}&limit=4`)))
      .then((results) => {
        if (ignore) return;
        setData(Object.fromEntries(SECTIONS.map((s, i) => [s.key, results[i]])));
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main>
      <section className="flex flex-col gap-6 p-10 sm:p-28 max-w-6xl mx-auto">
        <h1 className="text-slate-700 font-bold text-3xl lg:text-6xl">
          Find your next <span className="text-slate-500">perfect</span>
          <br />
          place with ease
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Browse homes for rent or sale, list your own property, and book a visit in a few clicks.
        </p>
        <Link to="/search" className="text-sm sm:text-base text-blue-800 font-bold hover:underline">
          Let&apos;s get started...
        </Link>
      </section>

      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-6">
        {loading && <Loader text="Loading listings..." />}
        <ErrorMessage>{error}</ErrorMessage>
        {!loading && !error && SECTIONS.every((s) => !data[s.key]?.length) && (
          <p className="text-slate-600">
            No listings yet.{' '}
            <Link to="/create-listing" className="text-blue-700 hover:underline">
              Create the first one
            </Link>
            .
          </p>
        )}
        {SECTIONS.map(
          (s) =>
            data[s.key]?.length > 0 && (
              <section key={s.key}>
                <div className="my-3">
                  <h2 className="text-2xl font-semibold text-slate-600">{s.title}</h2>
                  <Link to={s.more} className="text-sm text-blue-800 hover:underline">
                    Show more
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4">
                  {data[s.key].map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              </section>
            )
        )}
      </div>
    </main>
  );
}
