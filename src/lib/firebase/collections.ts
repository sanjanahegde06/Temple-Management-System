export const COLLECTIONS = {
  temples: "temples",
  users: "users",
  staff: "staff",
  devotees: "devotees",
  bookings: "bookings",
  donations: "donations",
  expenses: "expenses",
  notifications: "notifications",
} as const;

export type CollectionName =
  (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
