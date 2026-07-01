import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { ErrorMessage, Loader } from '../components/Status';
import { MAX_IMAGES, uploadImages, validateImageFile } from '../utils/uploadImages';

const EMPTY_FORM = {
  imageUrls: [],
  name: '',
  description: '',
  address: '',
  type: 'rent',
  bedrooms: 1,
  bathrooms: 1,
  regularPrice: 1000,
  discountPrice: 0,
  offer: false,
  parking: false,
  furnished: false,
};

// Used for BOTH /create-listing and /update-listing/:listingId
export default function CreateListing() {
  const { listingId } = useParams();
  const isEdit = Boolean(listingId);
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [progress, setProgress] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setForm(EMPTY_FORM);
      return;
    }
    let ignore = false;
    api(`/api/listing/get/${listingId}`)
      .then((listing) => {
        if (ignore) return;
        if (listing.userRef !== currentUser._id) return setError('You can only edit your own listings');
        const next = {};
        Object.keys(EMPTY_FORM).forEach((key) => {
          next[key] = listing[key];
        });
        setForm(next);
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoadingListing(false));
    return () => {
      ignore = true;
    };
  }, [isEdit, listingId, currentUser._id]);

  const handleUpload = async () => {
    setUploadError('');
    if (!files.length) return setUploadError('Choose at least one image first');
    if (files.length + form.imageUrls.length > MAX_IMAGES) {
      return setUploadError(`You can have at most ${MAX_IMAGES} images per listing`);
    }
    const invalid = files.map(validateImageFile).find(Boolean);
    if (invalid) return setUploadError(invalid);

    setUploading(true);
    setProgress(files.map(() => 0));
    try {
      // All files upload in parallel; each one reports its own progress
      const urls = await uploadImages(files, (i, pct) =>
        setProgress((prev) => {
          const next = [...prev];
          next[i] = pct;
          return next;
        })
      );
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      setFiles([]);
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setProgress([]);
    }
  };

  const removeImage = (index) =>
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    if (id === 'sale' || id === 'rent') setForm({ ...form, type: id });
    else if (type === 'checkbox') setForm({ ...form, [id]: checked });
    else if (type === 'number') setForm({ ...form, [id]: value === '' ? '' : Number(value) });
    else setForm({ ...form, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.imageUrls.length < 1) return setError('Upload at least one image');
    if (form.offer && Number(form.discountPrice) >= Number(form.regularPrice)) {
      return setError('Discount price must be lower than regular price');
    }

    const body = {
      ...form,
      regularPrice: Number(form.regularPrice),
      discountPrice: form.offer ? Number(form.discountPrice) : 0,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
    };

    setLoading(true);
    try {
      const url = isEdit ? `/api/listing/update/${listingId}` : '/api/listing/create';
      const listing = await api(url, { method: 'POST', body });
      navigate(`/listing/${listing._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingListing) return <Loader />;

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">{isEdit ? 'Update a Listing' : 'Create a Listing'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col gap-4 flex-1">
          <FormInput id="name" placeholder="Name" maxLength={100} minLength={3} required value={form.name} onChange={handleChange} />
          <FormInput
            id="description"
            as="textarea"
            placeholder="Description"
            required
            maxLength={2000}
            value={form.description}
            onChange={handleChange}
          />
          <FormInput id="address" placeholder="Address" required value={form.address} onChange={handleChange} />

          <div className="flex gap-6 flex-wrap">
            {[
              ['sale', 'Sell', form.type === 'sale'],
              ['rent', 'Rent', form.type === 'rent'],
              ['parking', 'Parking spot', form.parking],
              ['furnished', 'Furnished', form.furnished],
              ['offer', 'Offer', form.offer],
            ].map(([id, label, checked]) => (
              <label key={id} htmlFor={id} className="flex gap-2 items-center cursor-pointer">
                <input type="checkbox" id={id} className="w-5 h-5" checked={checked} onChange={handleChange} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-6">
            <FormInput id="bedrooms" label="Beds" type="number" min="1" max="50" required value={form.bedrooms} onChange={handleChange} />
            <FormInput id="bathrooms" label="Baths" type="number" min="1" max="50" required value={form.bathrooms} onChange={handleChange} />
            <FormInput
              id="regularPrice"
              label={`Regular price ${form.type === 'rent' ? '(₹ / month)' : '(₹)'}`}
              type="number"
              min="1"
              required
              value={form.regularPrice}
              onChange={handleChange}
            />
            {form.offer && (
              <FormInput
                id="discountPrice"
                label={`Discounted price ${form.type === 'rent' ? '(₹ / month)' : '(₹)'}`}
                type="number"
                min="0"
                required
                value={form.discountPrice}
                onChange={handleChange}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images:
            <span className="font-normal text-gray-600 ml-2">The first image will be the cover (max {MAX_IMAGES}, 2 MB each)</span>
          </p>
          <div className="flex gap-4">
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              multiple
              className="p-3 border border-gray-300 rounded w-full bg-white"
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
            <Button type="button" variant="outline" loading={uploading} onClick={handleUpload}>
              Upload
            </Button>
          </div>

          {progress.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {files.map((file, i) => (
                <li key={file.name + i} className="flex items-center gap-2">
                  <span className="truncate w-40">{file.name}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded">
                    <div className="h-2 bg-green-600 rounded" style={{ width: `${progress[i] || 0}%` }} />
                  </div>
                  <span className="w-10 text-right">{progress[i] || 0}%</span>
                </li>
              ))}
            </ul>
          )}
          <ErrorMessage>{uploadError}</ErrorMessage>

          {form.imageUrls.map((url, index) => (
            <div key={url} className="flex justify-between p-3 border items-center bg-white rounded-lg">
              <img src={url} alt={`Listing ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
              {index === 0 && <span className="text-xs text-slate-500">Cover</span>}
              <button type="button" onClick={() => removeImage(index)} className="p-3 text-red-700 uppercase hover:opacity-75">
                Delete
              </button>
            </div>
          ))}

          <Button type="submit" loading={loading} disabled={uploading}>
            {isEdit ? 'Update listing' : 'Create listing'}
          </Button>
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      </form>
    </main>
  );
}
