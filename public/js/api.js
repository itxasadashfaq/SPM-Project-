window.api = {
  async request(url, options = {}) {
    const response = await fetch(`/api${url}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  },
  get(url) { return this.request(url); },
  post(url, body) { return this.request(url, { method: "POST", body: JSON.stringify(body) }); },
  put(url, body) { return this.request(url, { method: "PUT", body: JSON.stringify(body) }); }
};
