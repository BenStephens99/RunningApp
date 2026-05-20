export const QueryCacheKeys = {
  user: () => ["user"],
  stravaToken: () => ["strava-token"],
  stravaAthlete: () => ["strava-athlete"],
  stravaActivities: () => ["strava-activities"],
  unconfirmedPlans: () => ["unconfirmed-plans"],
  runPlans: () => ["run-plans"],
  runPlan: (id: string) => ["run-plan", id],
  chats: () => ["chats"],
  chatMessages: (chatId: string) => ["chat-messages", chatId],
};
