const API_CONFIG = {
  BASE_URL: "http://127.0.0.1:8000/api",
  USE_API: true
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    headers: {"Content-Type":"application/json", ...(options.headers || {})},
    ...options
  });
  if (!response.ok) {
    let message = "The dungeon spirits are currently confused.";
    try { message = (await response.json()).detail || message; } catch (_) {}
    throw new Error(message);
  }
  return response.json();
}
