import { useEffect, useRef, useState } from 'react';
import {
  trackTimeEvent,
  estimateManualTime,
  getTimeSavedStats,
  formatTimeSaved,
  type TimeSavedStats,
} from '@/lib/time-tracking';

interface UseTimeTrackingOptions {
  userId: string;
  documentId: string;
  enabled?: boolean;
}

export function useTimeTracking({ userId, documentId, enabled = true }: UseTimeTrackingOptions) {
  const sessionStartTime = useRef<Date | null>(null);
  const [stats, setStats] = useState<TimeSavedStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start tracking session when component mounts
  useEffect(() => {
    if (!enabled) return;

    const startTime = new Date();
    sessionStartTime.current = startTime;

    trackTimeEvent({
      userId,
      documentId,
      eventType: 'session_start',
    });

    // End session when component unmounts
    return () => {
      if (sessionStartTime.current) {
        const endTime = new Date();
        const sessionDuration = (endTime.getTime() - sessionStartTime.current.getTime()) / 1000;

        trackTimeEvent({
          userId,
          documentId,
          eventType: 'session_end',
          metadata: {
            actualTimeSpent: sessionDuration,
          },
        });
      }
    };
  }, [userId, documentId, enabled]);

  // Track AI suggestion accepted
  const trackAISuggestion = async (
    suggestionType: string,
    complexity: 'simple' | 'medium' | 'complex' = 'medium',
    wordCount: number = 0,
    actualTimeSpent: number = 0
  ) => {
    if (!enabled) return;

    const manualTimeEstimate = estimateManualTime(suggestionType, complexity, wordCount);

    await trackTimeEvent({
      userId,
      documentId,
      eventType: 'ai_suggestion',
      metadata: {
        suggestionType,
        editComplexity: complexity,
        wordCount,
        manualTimeEstimate,
        actualTimeSpent,
      },
    });

    // Refresh stats
    refreshStats();
  };

  // Track edit applied
  const trackEditApplied = async (
    editType: string,
    complexity: 'simple' | 'medium' | 'complex' = 'medium',
    wordCount: number = 0,
    changesCount: number = 1,
    actualTimeSpent: number = 0
  ) => {
    if (!enabled) return;

    const manualTimeEstimate = estimateManualTime(editType, complexity, wordCount) * changesCount;

    await trackTimeEvent({
      userId,
      documentId,
      eventType: 'edit_applied',
      metadata: {
        suggestionType: editType,
        editComplexity: complexity,
        wordCount,
        changesCount,
        manualTimeEstimate,
        actualTimeSpent,
      },
    });

    // Refresh stats
    refreshStats();
  };

  // Refresh statistics
  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const newStats = await getTimeSavedStats(userId);
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh time stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    if (enabled) {
      refreshStats();
    }
  }, [userId, enabled]);

  return {
    stats,
    isLoading,
    trackAISuggestion,
    trackEditApplied,
    refreshStats,
    formatTimeSaved,
  };
}

