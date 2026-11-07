import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  buildLemonSqueezyCheckoutUrl,
  LEMON_SQUEEZY_CHECKOUT_URL,
  LEMON_SQUEEZY_LIFETIME_CHECKOUT_URL,
  type UpgradeToProOptions,
} from '../contexts/AuthContext';
import { DashboardPage } from '../pages/DashboardPage';
import { PricingPage } from '../pages/PricingPage';

const mockUpgradeToPro = vi.fn<(options?: UpgradeToProOptions) => Promise<void>>();
const mockOpenBillingPortal = vi.fn();
const mockShowToast = vi.fn();

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, defaultVal?: string) => defaultVal || key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
      },
    }),
  };
});

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: {
        uid: 'pro_user_123',
        email: 'pro@pdfminty.com',
        displayName: 'Pro Member',
        photoURL: null,
        plan: 'pro',
        isPro: true,
        emailVerified: true,
      },
      firebaseUser: {
        uid: 'pro_user_123',
        email: 'pro@pdfminty.com',
      },
      isPro: true,
      loading: false,
      isConfigured: true,
      upgradeToPro: mockUpgradeToPro,
      openBillingPortal: mockOpenBillingPortal,
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      resetPassword: vi.fn(),
      sendVerificationEmail: vi.fn(),
      reloadUser: vi.fn(),
    }),
  };
});

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../contexts/UsageLimitContext', () => ({
  useUsageLimit: () => ({
    dailyTasksLimit: Infinity,
    tasksUsed: 2,
    tasksRemaining: Infinity,
    maxFileSizeMB: 500,
  }),
}));

describe('Pro Billing Actions & Lemon Squeezy Checkout URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUpgradeToPro.mockResolvedValue(undefined);
  });

  it('builds Lemon Squeezy checkout URL with uid, email, and plan metadata without test flags for both Monthly ($2.49) and Lifetime ($50)', () => {
    expect(LEMON_SQUEEZY_CHECKOUT_URL).toBe(
      'https://checkout.pdfminty.com/checkout/buy/0deca708-5914-4536-8742-ce0bca45e338'
    );
    expect(LEMON_SQUEEZY_LIFETIME_CHECKOUT_URL).toBe(
      'https://checkout.pdfminty.com/checkout/buy/4584e207-22ab-49c9-a29f-a09a2e76c417'
    );

    const monthlyUrl = new URL(
      buildLemonSqueezyCheckoutUrl('user_abc', 'owner@pdfminty.com', 'monthly')
    );
    expect(monthlyUrl.origin + monthlyUrl.pathname).toBe(
      'https://checkout.pdfminty.com/checkout/buy/0deca708-5914-4536-8742-ce0bca45e338'
    );
    expect(monthlyUrl.searchParams.get('checkout[custom][uid]')).toBe('user_abc');
    expect(monthlyUrl.searchParams.get('checkout[custom][plan]')).toBe('monthly');
    expect(monthlyUrl.searchParams.get('checkout[email]')).toBe('owner@pdfminty.com');
    expect(monthlyUrl.searchParams.has('test')).toBe(false);
    expect(monthlyUrl.searchParams.has('checkout[test]')).toBe(false);

    const lifetimeUrl = new URL(
      buildLemonSqueezyCheckoutUrl('user_abc', 'owner@pdfminty.com', 'lifetime')
    );
    expect(lifetimeUrl.origin + lifetimeUrl.pathname).toBe(
      'https://checkout.pdfminty.com/checkout/buy/4584e207-22ab-49c9-a29f-a09a2e76c417'
    );
    expect(lifetimeUrl.searchParams.get('checkout[custom][uid]')).toBe('user_abc');
    expect(lifetimeUrl.searchParams.get('checkout[custom][plan]')).toBe('lifetime');
    expect(lifetimeUrl.searchParams.get('checkout[email]')).toBe('owner@pdfminty.com');
  });

  it('executes Confirm Renewal, Confirm Lifetime ($50), and Confirm Cancel on DashboardPage when user is already Pro', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Navigate to Billing tab
    const billingTabButtons = screen.getAllByRole('button', { name: /Manage Subscription/i });
    fireEvent.click(billingTabButtons[0]);

    // 1. Test "Renew Subscription" -> "Confirm Renewal"
    const renewTrigger = screen.getByRole('button', { name: /Renew Subscription/i });
    fireEvent.click(renewTrigger);

    const confirmRenewalBtn = screen.getByRole('button', { name: /Confirm Renewal/i });
    fireEvent.click(confirmRenewalBtn);

    await waitFor(() => {
      expect(mockUpgradeToPro).toHaveBeenCalledWith({
        plan: 'monthly',
        allowWhenPro: true,
      });
    });
    expect(localStorage.getItem('pdfminty_sub_autorenew_pro_user_123')).toBe('true');

    // 2. Test "Get Lifetime Deal ($50)" -> "Confirm Lifetime ($50)"
    mockUpgradeToPro.mockClear();
    const lifetimeTrigger = screen.getByRole('button', { name: /Get Lifetime Deal \(\$50\)/i });
    fireEvent.click(lifetimeTrigger);

    const confirmLifetimeBtn = screen.getByRole('button', { name: /Confirm Lifetime \(\$50\)/i });
    fireEvent.click(confirmLifetimeBtn);

    await waitFor(() => {
      expect(mockUpgradeToPro).toHaveBeenCalledWith({
        plan: 'lifetime',
        allowWhenPro: true,
      });
    });

    // 3. Test "Cancel Subscription" -> "Confirm Cancel"
    const cancelTrigger = screen.getByRole('button', { name: /Cancel Subscription/i });
    fireEvent.click(cancelTrigger);

    const confirmCancelBtn = screen.getByRole('button', { name: /Confirm Cancel/i });
    fireEvent.click(confirmCancelBtn);

    expect(localStorage.getItem('pdfminty_sub_autorenew_pro_user_123')).toBe('false');
    expect(mockOpenBillingPortal).toHaveBeenCalledTimes(1);
  });

  it('allows an active Monthly Pro user to purchase the Lifetime Deal ($50) on PricingPage and displays no money-back guarantee claims', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.queryByText(/money-back/i)).toBeNull();
    expect(screen.queryByText(/14-day/i)).toBeNull();
    expect(screen.getByText(/256-Bit Encrypted Checkout/i)).toBeInTheDocument();

    const lifetimeButton = screen.getByRole('button', { name: /Get Lifetime Deal/i });
    fireEvent.click(lifetimeButton);

    await waitFor(() => {
      expect(mockUpgradeToPro).toHaveBeenCalledWith({
        plan: 'lifetime',
        allowWhenPro: true,
      });
    });
  });
});
