export const QueryCacheKeys = {
  user: () => ["user"],
  runs: () => ["runs"],
  stravaToken: () => ["strava-token"],
  stravaAthlete: () => ["strava-athlete"],
  stravaActivities: () => ["strava-activities"],
  geminiMessage: (message: string) => ["gemini-message", message],
};
