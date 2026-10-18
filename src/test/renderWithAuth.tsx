import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, type InitialEntry } from 'react-router';
import { AuthContext, type AuthContextValue } from '../context/authContext';

export const makeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  stage: 'anonimo',
  user: null,
  refresh: vi.fn().mockResolvedValue('anonimo'),
  signOut: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export function renderWithAuth(
  ui: ReactElement,
  options: { auth?: Partial<AuthContextValue>; route?: InitialEntry } = {},
) {
  const auth = makeAuth(options.auth);
  const utils = render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  );
  return { auth, ...utils };
}
