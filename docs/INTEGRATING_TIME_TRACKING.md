# Integrating Time Tracking into the Editor

## Quick Start

To add time tracking to your editor component, follow these steps:

### 1. Import the Hook

```tsx
import { useTimeTracking } from '@/hooks/use-time-tracking';
```

### 2. Initialize Time Tracking

```tsx
const { trackAISuggestion, trackEditApplied, stats } = useTimeTracking({
  userId: 'user-123', // Get from auth context
  documentId: 'doc-456', // Current document ID
  enabled: true,
});
```

### 3. Track AI Suggestions

When a user accepts an AI suggestion:

```tsx
const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
  // Apply the suggestion...
  
  // Track the time saved
  await trackAISuggestion(
    'content_rewrite', // suggestion type
    'medium', // complexity: 'simple' | 'medium' | 'complex'
    suggestion.wordCount, // number of words affected
    30 // actual time spent in seconds (optional)
  );
};
```

### 4. Track Manual Edits

When a user makes manual edits:

```tsx
const handleManualEdit = async (edit: Edit) => {
  // Apply the edit...
  
  // Track the time saved (if it's something AI could have done)
  await trackEditApplied(
    'format_change', // edit type
    'simple', // complexity
    edit.wordCount,
    1, // number of changes
    45 // actual time spent in seconds
  );
};
```

## Example: Full Integration

```tsx
"use client";

import { useTimeTracking } from '@/hooks/use-time-tracking';
import { useState } from 'react';

export default function EditorPage() {
  const [documentId] = useState('doc-123');
  const [userId] = useState('user-456'); // In real app, get from auth
  
  const { trackAISuggestion, trackEditApplied, stats } = useTimeTracking({
    userId,
    documentId,
    enabled: true,
  });

  const handleAISuggestionAccept = async (suggestion: any) => {
    // Determine complexity based on suggestion
    const complexity = suggestion.changes.length > 5 ? 'complex' : 
                       suggestion.changes.length > 2 ? 'medium' : 'simple';
    
    // Calculate word count
    const wordCount = suggestion.text.split(' ').length;
    
    // Track the event
    await trackAISuggestion(
      suggestion.type, // e.g., 'content_rewrite', 'add_metric', etc.
      complexity,
      wordCount,
      Date.now() - suggestion.startTime // actual time spent
    );
    
    // Apply the suggestion...
  };

  return (
    <div>
      {/* Your editor UI */}
      {stats && (
        <div>
          Time saved this session: {formatTimeSaved(stats.totalTimeSaved)}
        </div>
      )}
    </div>
  );
}
```

## Suggestion Types

Common suggestion types you can track:

- `grammar_fix` - Grammar corrections
- `spelling_correction` - Spelling fixes
- `content_rewrite` - Content rewrites
- `add_metric` - Adding impact metrics
- `format_change` - Formatting changes
- `restructure_sentence` - Sentence restructuring
- `section_rewrite` - Section-level rewrites

## Complexity Levels

- **simple**: Quick fixes (1-3 min manual time)
- **medium**: Moderate edits (3-10 min manual time)
- **complex**: Major changes (10-15+ min manual time)

## Best Practices

1. **Track all AI interactions**: Every time a user accepts an AI suggestion, track it
2. **Be accurate with complexity**: Overestimate rather than underestimate
3. **Track actual time when possible**: Use timestamps to calculate real time spent
4. **Don't track trivial edits**: Only track edits that would take meaningful manual time
5. **Update stats periodically**: Refresh the dashboard stats after tracking events

## Testing

To test time tracking:

1. Open the editor
2. Accept some AI suggestions
3. Check the dashboard - you should see time saved updating
4. Check browser localStorage for `timeTrackingEvents` to see raw data

## Next Steps

1. Connect to your backend API to store events in database
2. Add analytics dashboard for admins
3. Show time saved notifications to users
4. Add time saved to user profiles
5. Create reports and insights

