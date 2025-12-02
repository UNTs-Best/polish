# How Time Tracking Works

## Overview

The time tracking system calculates "time saved" by comparing:
- **Manual editing time** (estimated based on industry benchmarks)
- **Actual time spent** (measured in the editor)

**Formula:** `Time Saved = Manual Time Estimate - Actual Time Spent`

## Step-by-Step Process

### 1. User Selects Text
When you select text in the editor:
- Timer starts (`suggestionStartTime.current = Date.now()`)
- This measures how long you spend reviewing and accepting the suggestion

### 2. AI Suggests Changes
The AI chat component provides suggestions based on your selection.

### 3. User Accepts Suggestion
When you click "Accept" on an AI suggestion:

1. **Calculate Actual Time Spent:**
   ```javascript
   actualTimeSpent = (Date.now() - suggestionStartTime) / 1000 // in seconds
   ```

2. **Determine Complexity:**
   - Simple: 1-2 changes
   - Medium: 3-5 changes  
   - Complex: 6+ changes

3. **Calculate Word Count:**
   - Counts words in both original and updated text

4. **Estimate Manual Time:**
   Based on the edit type and complexity:
   - **Simple edits** (grammar, spelling): ~1-2 minutes
   - **Medium edits** (rewrites, metrics): ~3-5 minutes
   - **Complex edits** (section rewrites): ~10-15 minutes

5. **Calculate Time Saved:**
   ```javascript
   timeSaved = manualTimeEstimate - actualTimeSpent
   ```

### 4. Store the Event
The event is stored with:
- User ID
- Document ID
- Event type (ai_suggestion, edit_applied, etc.)
- Timestamp
- Metadata (complexity, word count, time estimates)

### 5. Update Statistics
The dashboard and editor header update to show:
- Total time saved (sum of all events)
- Number of edits
- Average time per edit

## Manual Time Estimates

The system uses these baseline estimates (in seconds):

### Simple Edits
- Grammar fix: 120 seconds (2 min)
- Spelling correction: 60 seconds (1 min)
- Format change: 90 seconds (1.5 min)

### Medium Edits
- Content rewrite: 300 seconds (5 min)
- Add metric: 240 seconds (4 min)
- Restructure sentence: 180 seconds (3 min)

### Complex Edits
- Section rewrite: 600 seconds (10 min)
- Major restructure: 900 seconds (15 min)
- Add multiple metrics: 450 seconds (7.5 min)

**Note:** These are adjusted based on word count (more words = more time).

## Example Calculation

**Scenario:** User accepts AI suggestion to add a metric to a bullet point

1. **User selects text** → Timer starts
2. **AI suggests:** "Improved efficiency by 40% by developing..."
3. **User reviews for 30 seconds** → Clicks Accept
4. **System calculates:**
   - Edit type: `add_metric`
   - Complexity: `medium` (1 change)
   - Word count: 15 words
   - Manual estimate: 240 seconds (4 minutes)
   - Actual time: 30 seconds
   - **Time saved: 210 seconds (3.5 minutes)**

5. **Event stored** → Dashboard updates

## Data Storage

Currently, events are stored in:
- **Browser localStorage** (for demo/testing)
- **API endpoint** (`/api/time-tracking`) - ready for database integration

To view stored events:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Look for `timeTrackingEvents` in localStorage
4. You'll see JSON array of all tracked events

## Where Data is Displayed

1. **Editor Header** - Shows "Time saved: X" badge (updates in real-time)
2. **Dashboard** - Shows total time saved, sessions, edits
3. **API** - Can be queried via `/api/time-tracking/stats?userId=xxx`

