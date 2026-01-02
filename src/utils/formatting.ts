/**
 * Format distance from meters to kilometers
 */
export const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
};

/**
 * Format time from seconds to readable format with hours, minutes, and seconds
 * Format: "H:MM:SS" or "MM:SS"
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format time from seconds to short readable format
 * Format: "Xh Ym" or "Ym"
 */
export const formatTimeShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate and format pace from distance and moving time
 * Format: "X:XX /km"
 */
export const formatPace = (distance: number, movingTime: number): string => {
  if (distance === 0) return "N/A";
  const distanceKm = distance / 1000;
  const timeMinutes = movingTime / 60;
  const paceMinPerKm = timeMinutes / distanceKm;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.floor((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
};

