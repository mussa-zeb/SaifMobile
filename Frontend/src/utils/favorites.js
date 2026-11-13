const STORAGE_KEY = 'saif_mobile_favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const isFav = favs.includes(id);
  let newFavs;
  
  if (isFav) {
    newFavs = favs.filter(f => f !== id);
  } else {
    newFavs = [...favs, id];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
  
  // Broadcast event for Navbar to update count
  window.dispatchEvent(new Event('favoritesUpdated'));
  
  return !isFav;
}