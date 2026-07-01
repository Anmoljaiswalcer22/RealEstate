import Button from './Button';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Latest' },
  { value: 'createdAt_asc', label: 'Oldest' },
  { value: 'regularPrice_desc', label: 'Price high to low' },
  { value: 'regularPrice_asc', label: 'Price low to high' },
];

function Checkbox({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex gap-2 items-center cursor-pointer">
      <input id={id} type="checkbox" className="w-5 h-5" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

// Controlled component: the parent (Search page) owns the filter state
export default function FilterSidebar({ filters, onChange, onSubmit }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="searchTerm" className="whitespace-nowrap font-semibold">
          Search:
        </label>
        <input
          id="searchTerm"
          type="text"
          placeholder="Search..."
          className="border rounded-lg p-3 w-full"
          value={filters.searchTerm}
          onChange={(e) => set('searchTerm', e.target.value)}
        />
      </div>

      <fieldset className="flex gap-3 flex-wrap items-center">
        <legend className="font-semibold mb-2">Type:</legend>
        {['all', 'rent', 'sale'].map((type) => (
          <Checkbox
            key={type}
            id={`type-${type}`}
            label={type === 'all' ? 'Rent & Sale' : type === 'rent' ? 'Rent' : 'Sale'}
            checked={filters.type === type}
            onChange={() => set('type', type)}
          />
        ))}
        <Checkbox id="offer" label="Offer" checked={filters.offer} onChange={(e) => set('offer', e.target.checked)} />
      </fieldset>

      <fieldset className="flex gap-3 flex-wrap items-center">
        <legend className="font-semibold mb-2">Amenities:</legend>
        <Checkbox id="parking" label="Parking" checked={filters.parking} onChange={(e) => set('parking', e.target.checked)} />
        <Checkbox
          id="furnished"
          label="Furnished"
          checked={filters.furnished}
          onChange={(e) => set('furnished', e.target.checked)}
        />
      </fieldset>

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="font-semibold">
          Sort:
        </label>
        <select
          id="sort"
          className="border rounded-lg p-3"
          value={`${filters.sort}_${filters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('_');
            onChange({ ...filters, sort, order });
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Search</Button>
    </form>
  );
}
