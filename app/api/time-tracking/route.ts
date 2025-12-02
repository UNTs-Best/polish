import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/time-tracking
 * Track a time-saving event OR calculate stats from events
 * 
 * If request body contains `events` array, it calculates stats.
 * Otherwise, it tracks a single event.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a stats calculation request
    if (body.events && Array.isArray(body.events) && body.userId) {
      // Calculate stats from events
      const { events, userId } = body;

      // Filter events for this user
      const userEvents = events.filter((e: any) => e.userId === userId);

      // Calculate stats
      const stats = {
        totalTimeSaved: 0,
        totalSessions: 0,
        totalEdits: 0,
        averageTimePerEdit: 0,
        averageTimePerSession: 0,
        breakdown: {
          byType: {} as Record<string, number>,
          byComplexity: {} as Record<string, number>,
        },
      };

      const sessionTimes: number[] = [];
      let currentSessionStart: Date | null = null;

      userEvents.forEach((event: any) => {
        if (event.metadata?.timeSaved) {
          stats.totalTimeSaved += event.metadata.timeSaved;
        }

        if (event.eventType === 'session_start') {
          currentSessionStart = new Date(event.timestamp);
          stats.totalSessions++;
        } else if (event.eventType === 'session_end' && currentSessionStart) {
          const sessionTime = (new Date(event.timestamp).getTime() - currentSessionStart.getTime()) / 1000;
          sessionTimes.push(sessionTime);
          currentSessionStart = null;
        }

        if (event.eventType === 'edit_applied' || event.eventType === 'ai_suggestion') {
          stats.totalEdits++;
        }

        // Breakdown by type
        if (event.metadata?.timeSaved) {
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

      return NextResponse.json(stats);
    }

    // Otherwise, treat as a single event tracking request
    const event = body;

    // In a real app, you would:
    // 1. Validate the event data
    // 2. Store in your database (CosmosDB, PostgreSQL, etc.)
    // 3. Update user statistics
    // 4. Potentially send to analytics service

    // For now, we'll just return success
    // In production, you'd want to:
    // - Store in database
    // - Update user's time saved stats
    // - Handle errors properly

    console.log('Time tracking event received:', event);

    return NextResponse.json({ success: true, eventId: event.id || 'generated-id' });
  } catch (error) {
    console.error('Error in POST /api/time-tracking:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/time-tracking/stats
 * Get time saved statistics for a user
 * 
 * Note: Since we're using localStorage on the client side for now,
 * this endpoint accepts events in the request body to calculate stats.
 * In production, this would query a database.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // For now, return a response that tells the client to use localStorage
    // In production, this would query the database
    return NextResponse.json(
      { 
        message: 'Use client-side localStorage for now',
        useClientSide: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting time stats:', error);
    return NextResponse.json(
      { error: 'Failed to get time stats' },
      { status: 500 }
    );
  }
}


