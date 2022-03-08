import { useEffect, useState, createContext, useContext } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";

const Authenticate = {
  get: () => Promise.resolve({ accessToken: 'foo'})
}

const delay = (ms) => new Promise(res => setTimeout(res, ms))

const initialAuthState = {
  accessToken: null,
  error: null,
};

const AuthContext = createContext(initialAuthState);

const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialAuthState);
  useEffect(() => {
    Authenticate.get()
      .then(setAuthState)
      // Even though this has a catch handler, the rejected promise still somehow causes
      // an exception to be thrown in the test
      .catch((error) => {
        console.log('Catching authenticate error:', error)
        setAuthState((prev) => ({ ...prev, error }))
      });
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
};

const accessToken = "secretToken";
const errorMsg = "why the heck is this being thrown";

const authStateWithToken = {
  accessToken,
  error: null,
};

const TestComp = () => {
  return (
    <AuthProvider>
      <ChildComp />
    </AuthProvider>
  );
};

const ChildComp = () => {
  const { accessToken, error } = useContext(AuthContext);
  return (
    <div>
      <h1 data-testid="accessToken">{accessToken}</h1>
      <h1 data-testid="error">{error}</h1>
    </div>
  );
};

it("Sets authState based on the response of authenticate", async () => {
  const spy =  jest.spyOn(Authenticate, 'get')
  spy.mockReturnValue(
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
  spy.mockRestore()
});

it("Catches error and sets error in authState", async () => {
  const spy = jest.spyOn(Authenticate, 'get')
  // For some reason this mock Promise reject is being thrown from the waitFor helper
  spy.mockReturnValue(Promise.reject(errorMsg));

  // If I use `mockRejectedValue`, there's no exception thrown 😕
  // spy.mockRejectedValue(errorMsg);

  // If I add a little delay, there's no exception thrown 😕😕
  // spy.mockReturnValue(delay(100).then(() => Promise.reject(errorMsg)));

  await act(async () => {
    render(<TestComp />);
    console.log('acting...')
    await waitFor(() => {
    //   console.log('Waiting for... what is it?', screen.getByTestId("error").textContent)
    //   // If you uncomment the try-catch, there's no error
    //   // try {
    //   // ❌❌❌ For some reason this throws the rejected promise 😕
      expect(screen.getByTestId("error")).toHaveTextContent(errorMsg);
      // console.log('after expect')
    //   // } catch {}
    });
  });
  expect(screen.getByTestId("accessToken")).toHaveTextContent("");
  expect(screen.getByTestId("error")).toHaveTextContent(errorMsg);
  spy.mockRestore()
});
