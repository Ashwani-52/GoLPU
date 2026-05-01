const API_BASE = '/api';

export const fetchLocations = async () => {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error('Failed to fetch locations');
    return await res.json();
  } catch (error) {
    console.error("Error fetching locations:", error);
    return { count: 0, locations: [] };
  }
};

export const navigateCampus = async (start, end, mode = "auto") => {
  try {
    const res = await fetch(`${API_BASE}/navigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, end, mode })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to calculate route');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Navigation error:", error);
    throw error;
  }
};
