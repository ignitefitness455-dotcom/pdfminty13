import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { TaskLimitModal } from '../components/TaskLimitModal';
import {
  type UserTier,
  type UsageStatus,
  getUsageStatus,
  recordDailyTask,
  subscribeUsage,
} from '../utils/usageLimit';

import { useAuth } from './AuthContext';

export interface UsageLimitContextType {
  tier: UserTier;
  maxFileSizeMB: number;
  dailyTasksLimit: number | 'unlimited';
  tasksUsed: number;
  tasksRemaining: number | 'unlimited';
  isLimitReached: boolean;
  recordTask: (toolId?: string) => boolean;
  canPerformTask: () => boolean;
  openLimitModal: (options: { reason: 'task_limit' | 'file_size'; attemptedFileSizeMB?: number }) => void;
  closeLimitModal: () => void;
}

const UsageLimitContext = createContext<UsageLimitContextType | undefined>(undefined);

export const UsageLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [status, setStatus] = useState<UsageStatus>(() => getUsageStatus(user));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<'task_limit' | 'file_size'>('task_limit');
  const [attemptedFileSizeMB, setAttemptedFileSizeMB] = useState<number | undefined>(undefined);

  const refreshStatus = useCallback(() => {
    setStatus(getUsageStatus(user));
  }, [user]);

  // Update whenever auth state changes
  useEffect(() => {
    refreshStatus();
  }, [user, refreshStatus]);

  // Subscribe to storage and custom event updates
  useEffect(() => {
    const unsubscribe = subscribeUsage(() => {
      refreshStatus();
    });
    return unsubscribe;
  }, [refreshStatus]);

  const openLimitModal = useCallback(
    (options: { reason: 'task_limit' | 'file_size'; attemptedFileSizeMB?: number }) => {
      setModalReason(options.reason);
      setAttemptedFileSizeMB(options.attemptedFileSizeMB);
      setModalOpen(true);
    },
    []
  );

  const closeLimitModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const canPerformTask = useCallback((): boolean => {
    const current = getUsageStatus(user);
    return !current.isLimitReached;
  }, [user]);

  const recordTask = useCallback(
    (toolId?: string): boolean => {
      const res = recordDailyTask(user, toolId);
      refreshStatus();
      if (!res.success) {
        openLimitModal({ reason: 'task_limit' });
      }
      return res.success;
    },
    [user, refreshStatus, openLimitModal]
  );

  const contextValue = useMemo<UsageLimitContextType>(
    () => ({
      tier: status.tier,
      maxFileSizeMB: status.maxFileSizeMB,
      dailyTasksLimit: status.dailyTasksLimit,
      tasksUsed: status.tasksUsed,
      tasksRemaining: status.tasksRemaining,
      isLimitReached: status.isLimitReached,
      recordTask,
      canPerformTask,
      openLimitModal,
      closeLimitModal,
    }),
    [status, recordTask, canPerformTask, openLimitModal, closeLimitModal]
  );

  return (
    <UsageLimitContext.Provider value={contextValue}>
      {children}
      <TaskLimitModal
        isOpen={modalOpen}
        onClose={closeLimitModal}
        reason={modalReason}
        tier={status.tier}
        attemptedFileSizeMB={attemptedFileSizeMB}
      />
    </UsageLimitContext.Provider>
  );
};

export const useUsageLimit = (): UsageLimitContextType => {
  const context = useContext(UsageLimitContext);
  if (!context) {
    const fallbackStatus = getUsageStatus(null);
    return {
      tier: fallbackStatus.tier,
      maxFileSizeMB: fallbackStatus.maxFileSizeMB,
      dailyTasksLimit: fallbackStatus.dailyTasksLimit,
      tasksUsed: fallbackStatus.tasksUsed,
      tasksRemaining: fallbackStatus.tasksRemaining,
      isLimitReached: fallbackStatus.isLimitReached,
      recordTask: () => true,
      canPerformTask: () => !fallbackStatus.isLimitReached,
      openLimitModal: () => {},
      closeLimitModal: () => {},
    };
  }
  return context;
};
