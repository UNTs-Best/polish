/**
 * Time Tracking Utility
 * 
 * Tracks time saved by comparing manual editing time vs AI-assisted editing
 * 
 * Methodology:
 * - Manual editing benchmarks (based on industry research):
 *   - Simple edit (grammar/spelling): ~2-3 minutes
 *   - Content rewrite: ~5-10 minutes
 *   - Formatting change: ~1-2 minutes
 *   - Adding metrics/impact: ~3-5 minutes
 *   - Restructuring section: ~10-15 minutes
 * 
 * - AI-assisted time: Actual time spent in editor
 * - Time saved = Manual time - AI time
 */

export interface TimeTrackingEvent {
  id: string;
  userId: string;
  documentId: string;
  eventType: 'ai_suggestion' | 'edit_applied' | 'format_change' | 'content_rewrite' | 'session_start' | 'session_end';
  timestamp: Date;
  metadata?: {
    suggestionType?: string;
    editComplexity?: 'simple' | 'medium' | 'complex';
    wordCount?: number;
    changesCount?: number;
    manualTimeEstimate?: number; // in seconds
    actualTimeSpent?: number; // in seconds
    timeSaved?: number; // in seconds
  };
}

export interface TimeSavedStats {
  totalTimeSaved: number; // in seconds
  totalSessions: number;
  totalEdits: number;
  averageTimePerEdit: number;
  averageTimePerSession: number;
  breakdown: {
    byType: Record<string, number>;
    byComplexity: Record<string, number>;
  };
}

// Manual editing time estimates (in seconds)
const MANUAL_TIME_ESTIMATES = {
  simple: {
    grammar_fix: 120, // 2 minutes
    spelling_correction: 60, // 1 minute
    format_change: 90, // 1.5 minutes
  },
  medium: {
    content_rewrite: 300, // 5 minutes
    add_metric: 240, // 4 minutes
    restructure_sentence: 180, // 3 minutes
  },
  complex: {
    section_rewrite: 600, // 10 minutes
    major_restructure: 900, // 15 minutes
    add_multiple_metrics: 450, // 7.5 minutes
  },
};

/**
 * Estimate manual editing time based on edit type and complexity
 */
export function estimateManualTime(
  eventType: string,
  complexity: 'simple' | 'medium' | 'complex' = 'medium',
  wordCount: number = 0
): number {
  const baseTime = MANUAL_TIME_ESTIMATES[complexity][eventType as keyof typeof MANUAL_TIME_ESTIMATES.medium] 
    || MANUAL_TIME_ESTIMATES.medium.content_rewrite;

  // Adjust for word count (more words = more time)
  const wordMultiplier = Math.max(1, wordCount / 50); // Base: 50 words
  
  return Math.round(baseTime * wordMultiplier);
}

/**
 * Calculate time saved for a single event
 */
export function calculateTimeSaved(
  manualTimeEstimate: number,
  actualTimeSpent: number
): number {
  return Math.max(0, manualTimeEstimate - actualTimeSpent);
}

/**
 * Format time in seconds to human-readable string
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Format time saved for display (e.g., "12.5h", "45m")
 */
export function formatTimeSaved(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = (seconds / 60).toFixed(1);
    return `${parseFloat(minutes)}m`;
  } else {
    const hours = (seconds / 3600).toFixed(1);
    return `${parseFloat(hours)}h`;
  }
}

/**
 * Track a time-saving event
 */
export async function trackTimeEvent(event: Omit<TimeTrackingEvent, 'id' | 'timestamp'>): Promise<void> {
  const fullEvent: TimeTrackingEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };

  // Calculate time saved if we have the data
  if (fullEvent.metadata?.manualTimeEstimate && fullEvent.metadata?.actualTimeSpent) {
    fullEvent.metadata.timeSaved = calculateTimeSaved(
      fullEvent.metadata.manualTimeEstimate,
      fullEvent.metadata.actualTimeSpent
    );
  }

  // Store in localStorage (primary storage for now)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingEvents = JSON.parse(localStorage.getItem('timeTrackingEvents') || '[]');
      existingEvents.push(fullEvent);
      localStorage.setItem('timeTrackingEvents', JSON.stringify(existingEvents));
      console.log('Time event stored in localStorage:', fullEvent.id);
    }
  } catch (error) {
    console.error('Failed to track time event in localStorage:', error);
  }

  // Also send to API if available (for future database storage)
  try {
    const response = await fetch('/api/time-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEvent),
    });
    if (!response.ok) {
      console.log('Time tracking API returned error, using localStorage only');
    }
  } catch (error) {
    // API might not be set up yet, that's okay
    console.log('Time tracking API not available, using localStorage only');
  }
}

/**
 * Get time saved statistics for a user
 */
export async function getTimeSavedStats(userId: string): Promise<TimeSavedStats> {
  // Always use localStorage for now since we don't have a database
  // In production, this would query the API which queries the database
  
  // Get events from localStorage
  let events: TimeTrackingEvent[] = [];
  try {
    const stored = localStorage.getItem('timeTrackingEvents');
    if (stored) {
      events = JSON.parse(stored).filter((e: TimeTrackingEvent) => e.userId === userId);
    }
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    events = [];
  }

  // Try to sync with API (send events for server-side storage in future)
  try {
    const response = await fetch('/api/time-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        events: JSON.parse(localStorage.getItem('timeTrackingEvents') || '[]')
      }),
    });
    if (response.ok) {
      const apiStats = await response.json();
      // Use API stats if available and valid
      if (apiStats.totalTimeSaved !== undefined) {
        return apiStats;
      }
    }
  } catch (error) {
    // API not available, continue with localStorage calculation
    console.log('API not available, using localStorage only');
  }

  const stats: TimeSavedStats = {
    totalTimeSaved: 0,
    totalSessions: 0,
    totalEdits: 0,
    averageTimePerEdit: 0,
    averageTimePerSession: 0,
    breakdown: {
      byType: {},
      byComplexity: {},
    },
  };

  let totalActualTime = 0;
  const sessionTimes: number[] = [];
  let currentSessionStart: Date | null = null;

  events.forEach((event) => {
    // Ensure timestamp is a Date object
    const eventTime = event.timestamp instanceof Date 
      ? event.timestamp 
      : new Date(event.timestamp);

    // Add time saved
    if (event.metadata?.timeSaved && event.metadata.timeSaved > 0) {
      stats.totalTimeSaved += event.metadata.timeSaved;
    }

    // Track sessions
    if (event.eventType === 'session_start') {
      currentSessionStart = eventTime;
      stats.totalSessions++;
    } else if (event.eventType === 'session_end' && currentSessionStart) {
      const sessionTime = (eventTime.getTime() - currentSessionStart.getTime()) / 1000;
      if (sessionTime > 0) {
        sessionTimes.push(sessionTime);
        totalActualTime += sessionTime;
      }
      currentSessionStart = null;
    }

    // Count edits
    if (event.eventType === 'edit_applied' || event.eventType === 'ai_suggestion') {
      stats.totalEdits++;
    }

    // Breakdown by type
    if (event.metadata?.timeSaved && event.metadata.timeSaved > 0) {
      const type = event.eventType;
      stats.breakdown.byType[type] = (stats.breakdown.byType[type] || 0) + event.metadata.timeSaved;

      const complexity = event.metadata.editComplexity || 'medium';
      stats.breakdown.byComplexity[complexity] =
        (stats.breakdown.byComplexity[complexity] || 0) + event.metadata.timeSaved;
    }
  });

  if (stats.totalEdits > 0) {
    stats.averageTimePerEdit = stats.totalTimeSaved / stats.totalEdits;
  }

  if (sessionTimes.length > 0) {
    stats.averageTimePerSession = sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length;
  }

  return stats;
}

