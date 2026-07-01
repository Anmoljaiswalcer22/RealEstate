import { MdLocationOn } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

// Reusable, prop-driven card used on Home, Search and Profile pages
export default function ListingCard({ listing }) {
  const price = listing.offer ? listing.discountPrice : listing.regularPrice;

  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]">
      <Link to={`/listing/${listing._id}`}>
        <img
          src={listing.imageUrls[0]}
          alt={listing.name}
          className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="p-3 flex flex-col gap-2">
          <p className="truncate text-lg font-semibold text-slate-700">{listing.name}</p>
          <div className="flex items-center gap-1">
            <MdLocationOn className="h-4 w-4 text-green-700 shrink-0" />
            <p className="text-sm text-gray-600 truncate">{listing.address}</p>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
          <p className="text-slate-500 mt-2 font-semibold">
            {formatPrice(price)}
            {listing.type === 'rent' && ' / month'}
          </p>
          <div className="text-slate-700 flex gap-4 text-xs font-bold">
            <span>{listing.bedrooms > 1 ? `${listing.bedrooms} beds` : '1 bed'}</span>
            <span>{listing.bathrooms > 1 ? `${listing.bathrooms} baths` : '1 bath'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
