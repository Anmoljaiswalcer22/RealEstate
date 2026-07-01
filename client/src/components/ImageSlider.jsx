import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function ImageSlider({ images = [], alt = '' }) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;

  const go = (step) => setIndex((i) => (i + step + images.length) % images.length);

  return (
    <div className="relative h-[300px] sm:h-[500px] bg-slate-300 overflow-hidden">
      <img src={images[index]} alt={`${alt} ${index + 1}`} className="h-full w-full object-cover" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow"
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow"
          >
            <FaChevronRight />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
