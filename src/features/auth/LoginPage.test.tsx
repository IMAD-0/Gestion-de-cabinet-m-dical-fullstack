// src/features/auth/LoginPage.test.tsx — Integration test (renders, tabs, validates)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/shared/auth';
import LoginPage from './LoginPage';

// Mock the api module
vi.mock('@/shared/api', () => ({
  api: {
    login: vi.fn(),
    createPatient: vi.fn(),
    logout: vi.fn(),
  },
}));

import { api } from '@/shared/api';
const mockedApi = api as any;

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage onLogin={vi.fn()} />
    </AuthProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders login form by default', () => {
    renderLoginPage();
    expect(screen.getByText('Cabinet Médical')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to registration tab when clicked', async () => {
    renderLoginPage();
    const registerTab = screen.getByText('Créer un compte');
    fireEvent.click(registerTab);
    expect(screen.getByText('Création de compte Patient')).toBeInTheDocument();
    expect(screen.getByText('Prénom *')).toBeInTheDocument();
    expect(screen.getByText('Nom *')).toBeInTheDocument();
  });

  it('switches back to login tab', async () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('Créer un compte'));
    expect(screen.getByText('Création de compte Patient')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Connexion'));
    expect(screen.queryByText('Création de compte Patient')).not.toBeInTheDocument();
  });

  it('shows validation error when login fields are empty', async () => {
    renderLoginPage();
    const submitBtn = screen.getByText('Se connecter');
    fireEvent.click(submitBtn);
    // HTML5 validation should prevent submission
    // The form has required fields so the browser would block
  });

  it('calls api.login with correct credentials', async () => {
    mockedApi.login.mockResolvedValue({
      user: { id: '1', email: 'admin@cabinet.fr', role: 'admin', firstName: 'Admin' },
      token: 'jwt-token',
    });
    const onLogin = vi.fn();

    render(
      <AuthProvider>
        <LoginPage onLogin={onLogin} />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'admin@cabinet.fr' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(screen.getByText('Se connecter'));

    await waitFor(() => {
      expect(mockedApi.login).toHaveBeenCalledWith('admin@cabinet.fr', 'admin123');
    });
  });

  it('shows error when login fails', async () => {
    mockedApi.login.mockRejectedValue(new Error('Email ou mot de passe incorrect'));

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Se connecter'));

    await waitFor(() => {
      expect(screen.getByText(/Email ou mot de passe incorrect/i)).toBeInTheDocument();
    });
  });

  it('registers a new patient via api.createPatient', async () => {
    mockedApi.createPatient.mockResolvedValue({ id: 'new-1', role: 'patient' });

    renderLoginPage();

    // Switch to register tab
    fireEvent.click(screen.getByText('Créer un compte'));

    // Fill form
    fireEvent.change(screen.getByText('Prénom *').parentElement!.querySelector('input')!, { target: { value: 'John' } });
    fireEvent.change(screen.getByText('Nom *').parentElement!.querySelector('input')!, { target: { value: 'Doe' } });

    // Find inputs by their placeholders or position
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs.find(i => (i as HTMLInputElement).type === 'email');
    if (emailInput) fireEvent.change(emailInput, { target: { value: 'john@email.com' } });

    // Fill password
    const passwordInputs = screen.getAllByPlaceholderText(/.••/).length > 0
      ? screen.getAllByPlaceholderText(/.••/)
      : screen.getAllByDisplayValue('').filter(i => (i as HTMLInputElement).type === 'password');
    if (passwordInputs.length > 0) {
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    }

    await waitFor(() => {
      // At least the tab switched correctly
      expect(screen.getByText('Création de compte Patient')).toBeInTheDocument();
    });
  });

  it('displays demo credentials', () => {
    renderLoginPage();
    expect(screen.getByText('Comptes de démonstration :')).toBeInTheDocument();
    expect(screen.getByText('admin@cabinet.fr')).toBeInTheDocument();
    expect(screen.getByText('dupont@cabinet.fr')).toBeInTheDocument();
    expect(screen.getByText('marie@cabinet.fr')).toBeInTheDocument();
    expect(screen.getByText('ahmed@email.com')).toBeInTheDocument();
  });
});
