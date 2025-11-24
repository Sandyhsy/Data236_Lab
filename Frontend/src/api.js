// Use relative API path by default so the frontend calls the same host (ELB/ingress) that served it.
const BASE = process.env.REACT_APP_API_URL || "/api";

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export const api = {
  // --- Proxy uploads (multipart). Using arrow functions to avoid bundler edge cases.
  proxyProfileUpload: async (file) => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await fetch(`${BASE}/uploads/proxy-profile`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${txt ? ` - ${txt}` : ""}`);
    }
    return res.json();
  },

  proxyPropertyUpload: async (file, property_id) => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("property_id", property_id);
    const res = await fetch(`${BASE}/uploads/proxy-property`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${txt ? ` - ${txt}` : ""}`);
    }
    return res.json();
  },

  proxyStagingUpload: async (file) => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await fetch(`${BASE}/uploads/proxy-staging`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${txt ? ` - ${txt}` : ""}`);
    }
    return res.json();
  },

  // --- Auth & users
  me: () => req("/auth/me"),
  signup: (data) => req("/auth/signup", { method: "POST", body: data }),
  login: (data) => req("/auth/login", { method: "POST", body: data }),
  logout: () => req("/auth/logout", { method: "POST" }),

  ownerMe: () => req("/owner/me"),
  TravelerMe: () => req("/profile"),
  ownerUpdate: (data) => req("/owner/me", { method: "PUT", body: data }),
  dashboard: () => req("/owner/dashboard"),

  // --- Properties & images
  myProperties: () => req("/properties/mine"),
  myfavorites: () => req("/favorites"),
  loadAllProperties: () => req("/search"),
  searchProperty: (data) => req("/search/properties", { method: "POST", body: data }),
  createProperty: (data) => req("/properties", { method: "POST", body: data }),
  updateProperty: (id, data) => req(`/properties/${id}`, { method: "PUT", body: data }),
  deleteProperty: (id) => req(`/properties/${id}`, { method: "DELETE" }),
  deleteS3Object: (url) => req("/uploads/s3-delete", { method: "POST", body: { url } }),
  getProperty: (id) => req(`/properties/${id}`),

  presignUpload: ({ property_id, filename, contentType }) =>
    req("/uploads/s3-presign", { method: "POST", body: { property_id, filename, contentType } }),
  presignUploadTemp: ({ filename, contentType }) =>
    req("/uploads/s3-presign-temp", { method: "POST", body: { filename, contentType } }),
  finalizeTempUploads: ({ property_id, tempUrls }) =>
    req("/uploads/finalize", { method: "POST", body: { property_id, tempUrls } }),

  getPropertyImages: (propertyId) => req(`/properties/${propertyId}/images`),
  setPropertyImages: (propertyId, urls) =>
    req(`/properties/${propertyId}/images`, { method: "PUT", body: { urls } }),

  // --- Profile
  profileUpdate: (data) => req("/profile", { method: "PUT", body: data }),
  presignProfileUpload: ({ filename, contentType }) =>
    req("/uploads/s3-presign-profile", { method: "POST", body: { filename, contentType } }),

  // --- Bookings & favorites
  getbookings: () => req("/bookings"),
  getbookingStatus: () => req("/bookings/status"),
  getBookedDates: (id) => req(`/bookings/bookedDates/${id}`),
  createBooking: (data) => req("/bookings", { method: "POST", body: data }),
  addFavorite: (property_id, user_id) => req("/favorites", { method: "POST", body: { property_id, user_id } }),

  incoming: () => req("/bookings/incoming"),
  history: () => req("/bookings/history"),
  acceptBooking: (id) => req(`/bookings/${id}/accept`, { method: "PATCH" }),
  cancelBooking: (id) => req(`/bookings/${id}/cancel`, { method: "PATCH" }),
};
