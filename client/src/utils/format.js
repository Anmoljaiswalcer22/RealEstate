export const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
