/**
 * Debug utilities for time tracking
 * Use these in browser console to test and debug time tracking
 */

export const timeTrackingDebug = {
  /**
   * View all stored events
   */
  viewEvents: () => {
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return;
    }
    const events = JSON.parse(localStorage.getItem('timeTrackingEvents') || '[]');
    console.table(events);
    return events;
  },

  /**
   * View stats for a user
   */
  viewStats: async (userId: string = 'demo-user') => {
    const { getTimeSavedStats, formatTimeSaved } = await import('./time-tracking');
    const stats = await getTimeSavedStats(userId);
    console.log('Time Saved Stats:', {
      totalTimeSaved: formatTimeSaved(stats.totalTimeSaved),
      totalSessions: stats.totalSessions,
      totalEdits: stats.totalEdits,
      averageTimePerEdit: formatTimeSaved(stats.averageTimePerEdit),
      breakdown: stats.breakdown,
    });
    return stats;
  },

  /**
   * Clear all events (for testing)
   */
  clearEvents: () => {
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return;
    }
    localStorage.removeItem('timeTrackingEvents');
    console.log('All time tracking events cleared');
  },

  /**
   * Create a test event
   */
  createTestEvent: async () => {
    const { trackTimeEvent } = await import('./time-tracking');
    await trackTimeEvent({
      userId: 'demo-user',
      documentId: 'test-doc',
      eventType: 'ai_suggestion',
      metadata: {
        suggestionType: 'add_metric',
        editComplexity: 'medium',
        wordCount: 20,
        manualTimeEstimate: 240, // 4 minutes
        actualTimeSpent: 30, // 30 seconds
      },
    });
    console.log('Test event created');
  },
};

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).timeTrackingDebug = timeTrackingDebug;
}

