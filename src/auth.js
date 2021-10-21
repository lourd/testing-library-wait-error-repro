// Faking this for repro purposes
export const authenticateOrRedirect = () =>
  Promise.resolve({ accessToken: "foo", error: null });
