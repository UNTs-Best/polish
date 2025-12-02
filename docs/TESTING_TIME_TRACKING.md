# Testing Time Tracking Feature

## Quick Test Steps

### 1. Open the Editor
1. Go to `http://localhost:3000/editor`
2. You should see the editor with a sample resume

### 2. Select Text and Accept AI Suggestions
1. **Select some text** in the document (e.g., a bullet point)
2. The AI chat will show suggestions
3. **Click "Accept"** on a suggestion
4. **Look at the header** - you should see a green badge appear: "Time saved: X"

### 3. Accept Multiple Suggestions
1. Select different text sections
2. Accept 2-3 more AI suggestions
3. Watch the "Time saved" badge update in real-time

### 4. Check the Dashboard
1. Go to `http://localhost:3000/dashboard`
2. Look at the "Time Saved" stat card
3. It should show your cumulative time saved
4. "Documents Edited" should show number of sessions
5. "AI Suggestions" should show number of edits

## Detailed Testing Scenarios

### Test 1: Simple Edit (Grammar Fix)
1. Select a sentence with a grammar issue
2. Accept the AI suggestion
3. **Expected:** Time saved should be ~1-2 minutes

### Test 2: Medium Edit (Content Rewrite)
1. Select a longer bullet point
2. Accept AI suggestion to rewrite it
3. **Expected:** Time saved should be ~3-5 minutes

### Test 3: Complex Edit (Multiple Changes)
1. Select a section with multiple bullet points
2. Accept AI suggestion that changes multiple items
3. **Expected:** Time saved should be ~10-15 minutes

### Test 4: Session Tracking
1. Open editor (session starts automatically)
2. Make some edits
3. Close/refresh the page (session ends)
4. **Expected:** Session is tracked in statistics

## Verify Data Storage

### Check Browser localStorage
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** → `http://localhost:3000`
4. Look for key: `timeTrackingEvents`
5. Click on it to see the JSON data

**What you should see:**
```json
[
  {
    "id": "uuid-here",
    "userId": "demo-user",
    "documentId": "doc-1234567890",
    "eventType": "ai_suggestion",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {
      "suggestionType": "add_metric",
      "editComplexity": "medium",
      "wordCount": 15,
      "manualTimeEstimate": 240,
      "actualTimeSpent": 30,
      "timeSaved": 210
    }
  }
]
```

### Check API Endpoint
1. Open browser console (F12)
2. Run this command:
```javascript
fetch('/api/time-tracking/stats?userId=demo-user')
  .then(r => r.json())
  .then(console.log)
```

**Expected response:**
```json
{
  "totalTimeSaved": 210,
  "totalSessions": 1,
  "totalEdits": 1,
  "averageTimePerEdit": 210,
  "averageTimePerSession": 0,
  "breakdown": {
    "byType": {
      "ai_suggestion": 210
    },
    "byComplexity": {
      "medium": 210
    }
  }
}
```

## Testing Different Scenarios

### Scenario A: First-Time User
1. Clear localStorage: `localStorage.clear()`
2. Open editor
3. Accept one suggestion
4. **Check:** Time saved should appear in header
5. **Check:** Dashboard should show 1 edit, time saved

### Scenario B: Multiple Sessions
1. Accept suggestions in editor
2. Go to dashboard (see stats)
3. Go back to editor
4. Accept more suggestions
5. **Check:** Dashboard stats should accumulate

### Scenario C: Different Edit Types
1. Test grammar fixes (simple)
2. Test content rewrites (medium)
3. Test section rewrites (complex)
4. **Check:** Each should have different time saved values

## Troubleshooting

### Issue: Time saved not appearing
**Check:**
1. Browser console for errors
2. localStorage has `timeTrackingEvents` key
3. User ID is set correctly (`demo-user`)

### Issue: Dashboard shows 0
**Check:**
1. Events are in localStorage
2. User ID matches (`demo-user`)
3. Refresh dashboard page

### Issue: Time saved seems wrong
**Check:**
1. Complexity calculation (simple/medium/complex)
2. Edit type mapping (see `suggestionTypeMap` in editor)
3. Manual time estimates in `lib/time-tracking.ts`

## Manual Testing Checklist

- [ ] Editor header shows time saved badge
- [ ] Time saved updates after accepting suggestions
- [ ] Dashboard shows correct total time saved
- [ ] Dashboard shows correct number of edits
- [ ] Dashboard shows correct number of sessions
- [ ] localStorage contains tracking events
- [ ] API endpoint returns correct stats
- [ ] Multiple sessions accumulate correctly
- [ ] Different edit types show different time saved

## Expected Results

After accepting 3-4 suggestions:
- **Time Saved:** Should show 10-20+ minutes total
- **Documents Edited:** Should show 1 session
- **AI Suggestions:** Should show 3-4 edits
- **Header Badge:** Should update in real-time

## Next Steps for Production

1. **Connect to Database:** Update API to store in CosmosDB/PostgreSQL
2. **User Authentication:** Get real user ID from auth context
3. **Analytics:** Add analytics tracking
4. **Notifications:** Show time saved notifications
5. **Reports:** Create detailed time saved reports

