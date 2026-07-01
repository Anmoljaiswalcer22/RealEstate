import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import ListingCard from '../components/ListingCard';
import { ErrorMessage, Loader } from '../components/Status';

const PAGE_SIZE = 9;

// The URL is the single source of truth, so searches can be shared and bookmarked
function filtersFromUrl(search) {
  const p = new URLSearchParams(search);
  return {
    searchTerm: p.get('searchTerm') || '',
    type: ['rent', 'sale'].includes(p.get('type')) ? p.get('type') : 'all',
    parking: p.get('parking') === 'true',
    furnished: p.get('furnished') === 'true',
    offer: p.get('offer') === 'true',
    sort: p.get('sort') === 'regularPrice' ? 'regularPrice' : 'createdAt',
    order: p.get('order') === 'asc' ? 'asc' : 'desc',
  };
}

function toQuery(filters) {
  const p = new URLSearchParams();
  if (filters.searchTerm.trim()) p.set('searchTerm', filters.searchTerm.trim());
  p.set('type', filters.type);
  ['parking', 'furnished', 'offer'].forEach((key) => p.set(key, String(filters[key])));
  p.set('sort', filters.sort);
  p.set('order', filters.order);
  return p.toString();
}

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => filtersFromUrl(location.search));
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const current = filtersFromUrl(location.search);
    setFilters(current);
    let ignore = false;
    setLoading(true);
    setError('');
    api(`/api/listing/get?${toQuery(current)}&limit=${PAGE_SIZE}&startIndex=0`)
      .then((data) => {
        if (ignore) return;
        setListings(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [location.search]);

  const handleSubmit = () => navigate(`/search?${toQuery(filters)}`);

  const handleShowMore = async () => {
    setLoadingMore(true);
    try {
      const query = toQuery(filtersFromUrl(location.search));
      const data = await api(`/api/listing/get?${query}&limit=${PAGE_SIZE}&startIndex=${listings.length}`);
      setListings((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="flex flex-col md:flex-row">
      <aside className="p-7 border-b-2 md:border-r-2 md:min-h-screen md:w-[380px] shrink-0">
        <FilterSidebar filters={filters} onChange={setFilters} onSubmit={handleSubmit} />
      </aside>

      <section className="flex-1">
        <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">Listing results</h1>
        <div className="p-7 flex flex-wrap gap-4">
          {loading && <Loader />}
          <ErrorMessage>{error}</ErrorMessage>
          {!loading && !error && listings.length === 0 && <p className="text-xl text-slate-700">No listings found.</p>}
          {!loading && listings.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
        </div>
        {!loading && hasMore && (
          <button
            type="button"
            onClick={handleShowMore}
            disabled={loadingMore}
            className="text-green-700 hover:underline px-7 pb-7 w-full text-center"
          >
            {loadingMore ? 'Loading...' : 'Show more'}
          </button>
        )}
      </section>
    </main>
  );
}
