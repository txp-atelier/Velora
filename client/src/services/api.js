const API_BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("velora_token");

const request = async (path, options = {}) => {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.fields = data.fields || null;
    throw err;
  }
  return data;
};

export const authApi = {
  signup: (body) => request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
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
    const token = getToken();
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
