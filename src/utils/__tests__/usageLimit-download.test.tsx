import fs from 'fs';
import path from 'path';

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToolHeader } from '../../components/ToolHeader';
import * as AuthContextModule from '../../contexts/AuthContext';
import { downloadBlob, downloadBlobsSequentially } from '../download';
import {
  _resetUsageDeduplicatorForTesting,
  getStoredUsage,
  getUsageStatus,
  recordDailyTask,
  setSyncedAuthUid,
  setSyncedProStatus,
} from '../usageLimit';

describe('Unified Quota Gate, Tier File Size Limits & Single-Count Downloads (TASK-P1-01)', () => {
  beforeEach(() => {
    localStorage.clear();
    setSyncedAuthUid(null);
    setSyncedProStatus(false);
    _resetUsageDeduplicatorForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    setSyncedAuthUid(null);
    setSyncedProStatus(false);
    _resetUsageDeduplicatorForTesting();
    vi.restoreAllMocks();
  });

  it('enforces exact Guest (5 tasks / 100MB), Free (10 tasks / 150MB), and Pro (unlimited / 500MB) tier quotas', () => {
    // 1. Guest tier: 5 daily tasks, 100MB max file size
    const guestInitial = getUsageStatus(null);
    expect(guestInitial.tier).toBe('guest');
    expect(guestInitial.maxFileSizeMB).toBe(100);
    expect(guestInitial.dailyTasksLimit).toBe(5);

    for (let i = 0; i < 5; i++) {
      _resetUsageDeduplicatorForTesting();
      const res = recordDailyTask(null, 'test_task');
      expect(res.success).toBe(true);
    }
    _resetUsageDeduplicatorForTesting();
    const guestBlocked = recordDailyTask(null, 'test_task');
    expect(guestBlocked.success).toBe(false);
    expect(getUsageStatus(null).isLimitReached).toBe(true);

    // 2. Logged-in Free tier: 10 daily tasks, 150MB max file size
    const freeUser = { uid: 'free_uid_1', plan: 'free' as const };
    const freeInitial = getUsageStatus(freeUser);
    expect(freeInitial.tier).toBe('free');
    expect(freeInitial.maxFileSizeMB).toBe(150);
    expect(freeInitial.dailyTasksLimit).toBe(10);

    for (let i = 0; i < 10; i++) {
      _resetUsageDeduplicatorForTesting();
      expect(recordDailyTask(freeUser, 'test_task').success).toBe(true);
    }
    _resetUsageDeduplicatorForTesting();
    expect(recordDailyTask(freeUser, 'test_task').success).toBe(false);
    expect(getUsageStatus(freeUser).isLimitReached).toBe(true);

    // 3. Pro tier: unlimited daily tasks, 500MB max file size
    const proUser = { uid: 'pro_uid_1', plan: 'pro' as const, isPro: true };
    const proStatus = getUsageStatus(proUser);
    expect(proStatus.tier).toBe('pro');
    expect(proStatus.maxFileSizeMB).toBe(500);
    expect(proStatus.dailyTasksLimit).toBe('unlimited');
    expect(proStatus.isLimitReached).toBe(false);
  });

  it('records 1 task on automatic downloadBlob and 0 tasks on manual re-download with skipQuotaRecord', async () => {
    const blob = new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' });

    await downloadBlob(blob, 'compressed.pdf');
    expect(getUsageStatus(null).tasksUsed).toBe(1);

    _resetUsageDeduplicatorForTesting();
    await downloadBlob(blob, 'compressed.pdf', { skipQuotaRecord: true });
    expect(getUsageStatus(null).tasksUsed).toBe(1);
  });

  it('deducts only 1 task total when downloadBlobsSequentially exports multiple split parts', async () => {
    const parts = [1, 2, 3, 4].map((idx) => ({
      blob: new Blob([`%PDF-1.4 part ${idx}`], { type: 'application/pdf' }),
      filename: `split_part_${idx}.pdf`,
    }));

    await downloadBlobsSequentially(parts, 0);
    expect(getUsageStatus(null).tasksUsed).toBe(1);
  });

  it('attributes downloadBlob quota to synced Firebase user UID rather than guest bucket', async () => {
    setSyncedAuthUid('firebase_user_42');
    const blob = new Blob(['%PDF-1.4 user doc'], { type: 'application/pdf' });

    await downloadBlob(blob, 'merged.pdf');

    const stored = getStoredUsage();
    expect(stored.guestCount).toBe(0);
    expect(stored.userCounts.firebase_user_42).toBe(1);
  });

  it('renders accurate Guest (100MB), Free (150MB), and Pro (500MB) badges in ToolHeader even when limitMB={100} is passed', () => {
    const baseAuth = {
      user: null,
      firebaseUser: null,
      isPro: false,
      loading: false,
      isConfigured: true,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      upgradeToPro: vi.fn(),
      signInAsDemo: vi.fn(),
      sendVerificationEmail: vi.fn(),
      verifyEmailWithCode: vi.fn(),
      reloadUser: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePlan: vi.fn(),
      checkoutUrl: '',
    };

    const renderHeader = () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(
          <MemoryRouter>
            <ToolHeader slug="compress-pdf" limitMB={100} />
          </MemoryRouter>
        );
      });
      const text = container.textContent || '';
      act(() => {
        root.unmount();
      });
      container.remove();
      return text;
    };

    // Guest -> 100MB
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(baseAuth as never);
    expect(renderHeader()).toContain('100MB');

    // Logged-in Free -> 150MB
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...baseAuth,
      user: {
        uid: 'u_free',
        email: 'free@example.com',
        displayName: 'Free User',
        photoURL: null,
        plan: 'free',
        isPro: false,
        emailVerified: true,
      },
      isPro: false,
    } as never);
    expect(renderHeader()).toContain('150MB');

    // Pro -> PRO Limit: 500MB
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      ...baseAuth,
      user: {
        uid: 'u_pro',
        email: 'pro@example.com',
        displayName: 'Pro User',
        photoURL: null,
        plan: 'free', // Even if legacy `plan` is 'free', Firestore `isPro: true` activates Pro 500MB!
        isPro: true,
        emailVerified: true,
      },
      isPro: true,
    } as never);
    expect(renderHeader()).toContain('PRO Limit: 500MB');
  });

  it('prevents double-counting in SanitizePdfPage and SignPdfTool alongside downloadBlob', () => {
    const sanitizeSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/SanitizePdfPage.tsx'),
      'utf8'
    );
    const signSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/sign-pdf/sign-pdf-tool.tsx'),
      'utf8'
    );

    expect(sanitizeSrc).not.toContain("recordDailyTask(null, 'sanitize_pdf')");
    expect(signSrc).not.toContain("recordDailyTask(user, 'sign_pdf')");
  });
});
