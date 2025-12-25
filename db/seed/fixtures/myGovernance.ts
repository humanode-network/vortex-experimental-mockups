export const eraActivity = {
  era: "142",
  required: 18,
  completed: 11,
  actions: [
    { label: "Pool votes", done: 5, required: 6 },
    { label: "Chamber votes", done: 3, required: 6 },
    { label: "Court actions", done: 1, required: 3 },
    { label: "Proposals", done: 2, required: 3 },
  ],
  timeLeft: "22d 14h",
} as const;

export const myChamberIds = ["engineering", "product"] as const;
