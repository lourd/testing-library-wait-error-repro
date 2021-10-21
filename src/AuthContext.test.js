import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

import * as Auth from "./auth";

const accessToken = "secretToken";
const errorMsg = "why the heck is this being thrown";

jest.mock("./auth", () => {
  return {
    authenticateOrRedirect: jest.fn(),
  };
});

const emptyAuthState = {
  accessToken: null,
  idToken: null,
  expiresAt: null,
  tokenRenewalTimeoutId: null,
  useAuthlessToken: false,
};

const authStateWithToken = {
  ...emptyAuthState,
  accessToken,
};

const TestComp = () => {
  return (
    <AuthProvider>
      <ChildComp />
    </AuthProvider>
  );
};

const ChildComp = () => {
  const authState = useAuth();
  return (
    <div>
      <h1 data-testid="accessToken">{authState.accessToken}</h1>
      <h1 data-testid="error">{authState.error}</h1>
    </div>
  );
};

it("Sets authState based on the response of authenticateOrRedirect", async () => {
  Auth.authenticateOrRedirect.mockReturnValue(
    Promise.resolve(authStateWithToken)
  );

  await act(async () => {
    render(<TestComp />);
    // Even though this test is doing the same thing, it doesn't throw an exception
    await waitFor(() => {
      expect(screen.getByTestId("accessToken")).toHaveTextContent(accessToken);
    });
  });
  expect(screen.getByTestId("error")).toHaveTextContent("");
});

it("Catches error and sets error in authState", async () => {
  // Somehow this mock Promise reject is being thrown from the waitFor helper
  Auth.authenticateOrRedirect.mockReturnValue(Promise.reject(errorMsg));

  await act(async () => {
    render(<TestComp />);
    await waitFor(() => {
      // If you uncomment the try-catch, there's no error
      // try {
      // ❌❌❌ For some reason this throws the rejected promise 😕
      expect(screen.getByTestId("error")).toHaveTextContent(errorMsg);
      // } catch {}
    });
  });
  expect(screen.getByTestId("accessToken")).toHaveTextContent("");
  expect(screen.getByTestId("error")).toHaveTextContent(errorMsg);
});
