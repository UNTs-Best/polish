# Time Tracking Methodology

## Overview

This document explains how we track and calculate "time saved" when users edit documents using our AI-powered editor compared to manual editing.

## The Problem

How do we measure time saved? We can't directly observe what users would have done manually, so we use a combination of:
1. **Actual time tracking** - How long users spend in our editor
2. **Industry benchmarks** - Research-based estimates of manual editing times
3. **Event-based tracking** - Tracking specific actions and their complexity

## Methodology

### 1. Manual Editing Time Estimates

Based on industry research and user studies, we've established baseline estimates for common editing tasks:

#### Simple Edits (1-3 minutes)
- **Grammar fixes**: ~2 minutes
- **Spelling corrections**: ~1 minute  
- **Format changes**: ~1.5 minutes

#### Medium Edits (3-10 minutes)
- **Content rewrites**: ~5 minutes
- **Adding metrics/impact**: ~4 minutes
- **Restructuring sentences**: ~3 minutes

#### Complex Edits (10-15+ minutes)
- **Section rewrites**: ~10 minutes
- **Major restructuring**: ~15 minutes
- **Adding multiple metrics**: ~7.5 minutes

### 2. Actual Time Tracking

We track:
- **Session duration**: Time from opening to closing the editor
- **Per-action time**: Time spent on specific edits
- **AI suggestion acceptance time**: How quickly users accept AI suggestions

### 3. Time Saved Calculation

```
Time Saved = Manual Time Estimate - Actual Time Spent
```

**Example:**
- User accepts an AI suggestion to add a metric to a bullet point
- Manual estimate: 4 minutes (240 seconds)
- Actual time: 30 seconds (selecting text + accepting suggestion)
- **Time saved: 210 seconds (3.5 minutes)**

### 4. What We Track

#### Events Tracked:
1. **Session Start/End**: When user opens/closes editor
2. **AI Suggestions**: When AI provides suggestions
3. **Edit Applied**: When user accepts an edit
4. **Format Changes**: When formatting is modified
5. **Content Rewrites**: When content is rewritten

#### Metadata Collected:
- Edit type (grammar, rewrite, format, etc.)
- Complexity level (simple, medium, complex)
- Word count affected
- Number of changes
- Manual time estimate
- Actual time spent
- Calculated time saved

## Implementation

### Frontend Tracking

The `useTimeTracking` hook automatically:
- Tracks session start/end
- Records AI suggestion acceptances
- Records manual edits
- Calculates time saved in real-time

### Backend Storage

Events are stored with:
- User ID
- Document ID
- Timestamp
- Event type
- Metadata (time estimates, complexity, etc.)

### Dashboard Display

The dashboard shows:
- **Total Time Saved**: Sum of all time saved events
- **Average Time per Edit**: Total time saved / number of edits
- **Breakdown by Type**: Time saved by edit type
- **Breakdown by Complexity**: Time saved by complexity level

## Accuracy Considerations

### Limitations:
1. **Estimates are averages**: Individual users may be faster/slower
2. **Context matters**: Some edits are easier/harder than estimated
3. **Learning curve**: New users may take longer initially
4. **Multi-tasking**: Users might step away from editor

### Improvements:
- Collect user feedback on time estimates
- A/B test different estimation models
- Track user proficiency over time
- Adjust estimates based on actual data

## Future Enhancements

1. **Machine Learning Model**: Train on actual user data to improve estimates
2. **User Surveys**: Ask users to estimate manual time for validation
3. **Comparative Studies**: Run controlled studies comparing manual vs AI editing
4. **Real-time Adjustments**: Dynamically adjust estimates based on user patterns

## Example Scenarios

### Scenario 1: Grammar Fix
- **Action**: AI fixes 3 grammar errors
- **Manual estimate**: 3 × 2 minutes = 6 minutes
- **Actual time**: 45 seconds (review + accept)
- **Time saved**: 5.25 minutes

### Scenario 2: Adding Metrics
- **Action**: AI adds impact metrics to 5 bullet points
- **Manual estimate**: 5 × 4 minutes = 20 minutes
- **Actual time**: 2 minutes (review + accept all)
- **Time saved**: 18 minutes

### Scenario 3: Section Rewrite
- **Action**: AI rewrites entire experience section
- **Manual estimate**: 15 minutes
- **Actual time**: 3 minutes (review + accept + minor tweaks)
- **Time saved**: 12 minutes

## Conclusion

While our time estimates are based on industry research and best practices, they represent averages. The goal is to provide users with meaningful insights into the value they're getting from the AI-powered editor, while continuously improving our accuracy through data collection and user feedback.

