import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../src/lib/session', () => ({
  loadSession: jest.fn(),
  saveSession: jest.fn(),
  selectRoleRoute: jest.fn(),
}));

jest.mock('../src/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  login: jest.fn(),
}));

import LoginScreen from '../app/login';
import { login } from '../src/lib/api';
import { loadSession, saveSession, selectRoleRoute } from '../src/lib/session';

const mockReplace = jest.fn();
const mockLoadSession = jest.mocked(loadSession);
const mockSaveSession = jest.mocked(saveSession);
const mockSelectRoleRoute = jest.mocked(selectRoleRoute);
const mockLogin = jest.mocked(login);

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_KARAA_DEMO_MODE;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_KARAA_DEMO_MODE;
  });

  it('starts with empty credentials instead of embedded demo credentials', () => {
    mockLoadSession.mockResolvedValue(undefined);
    const rendered = render(<LoginScreen />);

    const emailField = rendered.getByPlaceholderText('Email');
    const passwordField = rendered.getByPlaceholderText('Password');

    expect(emailField.props.value).toBe('');
    expect(passwordField.props.value).toBe('');
    expect(emailField.props.placeholderTextColor).toBe('#46534B');
    expect(passwordField.props.placeholderTextColor).toBe('#46534B');
  });

  it('provides visible labels semantically associated with empty credential fields', () => {
    mockLoadSession.mockResolvedValue(undefined);
    const rendered = render(<LoginScreen />);

    const emailLabel = rendered.getByText('Email');
    const passwordLabel = rendered.getByText('Password');
    const emailField = rendered.getByPlaceholderText('Email');
    const passwordField = rendered.getByPlaceholderText('Password');

    expect(emailLabel.props.nativeID).toBe('email-label');
    expect(passwordLabel.props.nativeID).toBe('password-label');
    expect(emailField.props.accessibilityLabel).toBe('Email address');
    expect(passwordField.props.accessibilityLabel).toBe('Password');
    expect(emailField.props.accessibilityLabelledBy).toBe('email-label');
    expect(passwordField.props.accessibilityLabelledBy).toBe('password-label');
    expect(emailField.props.value).toBe('');
    expect(passwordField.props.value).toBe('');
  });

  it('explains that project access requires a secure connection without offline wording', () => {
    mockLoadSession.mockResolvedValue(undefined);
    const rendered = render(<LoginScreen />);

    expect(rendered.getByText('Karaa is online-only. Project data and actions require a secure connection to Karaa. This device stores only an encrypted sign-in session.')).toBeTruthy();
    expect(rendered.queryByText(/Karaa is offline/)).toBeNull();
  });

  it('shows a truthful retryable connection error when sign-in cannot reach Karaa', async () => {
    mockLoadSession.mockResolvedValue(undefined);
    mockLogin.mockRejectedValue(new Error('network unavailable'));
    const rendered = render(<LoginScreen />);

    fireEvent.changeText(rendered.getByPlaceholderText('Email'), 'anika.customer@karaa.demo');
    fireEvent.changeText(rendered.getByPlaceholderText('Password'), 'demo-password');
    fireEvent.press(rendered.getByRole('button', { name: 'Continue' }));

    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
  });

  it('uses a reference-style secure project access gateway instead of credentials in demo mode', async () => {
    mockLoadSession.mockResolvedValue(undefined);
    process.env.EXPO_PUBLIC_KARAA_DEMO_MODE = 'true';
    const rendered = render(<LoginScreen />);

    expect(rendered.getAllByLabelText('Karaa Global').length).toBeGreaterThan(0);
    expect(rendered.getByText('SECURE PROJECT ACCESS')).toBeTruthy();
    expect(rendered.getByText('Welcome back.')).toBeTruthy();
    expect(rendered.getByText('Choose a workspace')).toBeTruthy();
    expect(rendered.getByText('START GUIDED WORKSPACE')).toBeTruthy();
    expect(rendered.getByText('Continue as Field Employee')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open Field Employee workspace' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open Customer workspace' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open Management workspace' })).toBeTruthy();
    expect(rendered.getByLabelText('Demo visual: Amaravati solar campus')).toBeTruthy();
    expect(rendered.getByTestId('demo-entry-footer')).toBeTruthy();
    expect(rendered.getAllByText(/Amaravati Solar Commons/i).length).toBeGreaterThan(0);
    expect(rendered.queryByLabelText('Email address')).toBeNull();
    expect(rendered.queryByLabelText('Password')).toBeNull();
    expect(rendered.queryByText(/offline presentation|local session|bundled walkthrough|no account, network, or server/i)).toBeNull();

    fireEvent.press(rendered.getByRole('button', { name: 'Open Field Employee workspace' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/demo/employee'));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockSaveSession).not.toHaveBeenCalled();
    expect(mockLoadSession).not.toHaveBeenCalled();
  });

  it('routes a restored valid session to its server-defined workspace once', async () => {
    mockLoadSession.mockResolvedValue({
      token: 'token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: 'management-1', role: 'management' },
    });
    mockSelectRoleRoute.mockReturnValue({ pathname: '/management', title: 'Command Centre' } as never);

    render(<LoginScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/management'));
    expect(mockLoadSession).toHaveBeenCalledTimes(1);
    expect(mockSaveSession).not.toHaveBeenCalled();
  });

  it.each([
    ['absent session', () => Promise.resolve(undefined)],
    ['malformed or expired session', () => Promise.reject(new Error('SESSION_EXPIRED'))],
  ])('keeps the login form available for an %s', async (_label, sessionLoader) => {
    mockLoadSession.mockImplementation(sessionLoader);
    const rendered = render(<LoginScreen />);

    expect(await rendered.findByText('Sign in to your workspace')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
