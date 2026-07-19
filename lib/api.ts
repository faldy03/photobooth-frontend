const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Cek apakah berjalan di dalam aplikasi desktop Electron
    const isElectron = 
      navigator.userAgent.toLowerCase().includes('electron') || 
      (typeof (window as any).electron !== 'undefined');

    // Jika diakses via localhost ATAU sedang berjalan di dalam aplikasi desktop Electron, arahkan ke local Laragon port 8000
    if (
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1" || 
      isElectron
    ) {
      return "http://localhost:8000";
    }
  }
  // Default gunakan API hosting cloud
  return "https://boothflow.site";
};

export const API_BASE_URL = getBaseUrl();

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
