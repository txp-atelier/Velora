const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// The access token lives in memory only (never localStorage) — the refresh
// token that replaces it on expiry is a separate httpOnly cookie the server
// manages, so it's never reachable from JS in the first place.
let accessToken = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => { accessToken = token; };

const NO_REFRESH_RETRY = new Set(["/auth/login", "/auth/signup", "/auth/refresh"]);

let refreshPromise = null;
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("refresh failed");
        const data = await res.json();
        accessToken = data.token;
        return data.token;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const rawRequest = (path, options) => {
  const headers = { ...options.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
};

const request = async (path, options = {}) => {
  let res = await rawRequest(path, options);
  if (res.status === 401 && !NO_REFRESH_RETRY.has(path)) {
    try {
      await refreshAccessToken();
      res = await rawRequest(path, options);
    } catch {
      accessToken = null;
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.fields = data.fields || null;
    err.status = res.status;
    throw err;
  }
  return data;
};

export const authApi = {
  signup: (body) => request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  refresh: () => request("/auth/refresh", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (body) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
};

export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/products/${id}`),
  create: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => request(`/products/${id}`, { method: "DELETE" }),
  brands: () => request("/products/meta/brands"),
  categories: () => request("/products/meta/categories"),
};

export const cartApi = {
  get: () => request("/cart"),
  add: (productId, quantity = 1) =>
    request("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  update: (productId, quantity) =>
    request(`/cart/items/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  remove: (productId) => request(`/cart/items/${productId}`, { method: "DELETE" }),
  clear: () => request("/cart", { method: "DELETE" }),
};

export const ordersApi = {
  list: () => request("/orders"),
  create: (body) => request("/orders", { method: "POST", body: JSON.stringify(body) }),
  get: (id) => request(`/orders/${id}`),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const reviewsApi = {
  list: (productId, sort = "newest") =>
    request(`/reviews/product/${productId}?sort=${sort}`),
  eligibility: (productId) => request(`/reviews/product/${productId}/eligibility`),
  create: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  helpful: (id) => request(`/reviews/${id}/helpful`, { method: "POST" }),
};

export const uploadApi = {
  file: async (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    const token = accessToken;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(form);
    });
  },
  remove: (url) => request("/upload", { method: "DELETE", body: JSON.stringify({ url }) }),
};
