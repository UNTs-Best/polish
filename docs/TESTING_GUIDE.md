# Complete Testing Guide for Polish App

## 🚀 Quick Start Testing

### 1. File Upload Feature

**How to Test:**
1. Go to `http://localhost:3000/editor`
2. Click the "Upload" button in the header
3. Create a test resume file:
   - Create a `.txt` file with this format:
   ```
   Your Name
   your.email@example.com | (123) 456-7890 | linkedin.com/in/yourname
   
   Education
   University Name
   Bachelor of Science in Computer Science
   City, State
   May 2024
   
   Experience
   Software Engineer | Company Name | City, State | Jan 2023 - Present
   • Developed features using React and TypeScript
   • Improved performance by 30%
   • Led team of 3 developers
   
   Projects
   Project Name | Tech Stack | Jan 2023 - Present
   • Built a web application
   • Deployed to production
   
   Technical Skills
   Languages: JavaScript, Python, TypeScript
   Tools: Git, Docker, AWS
   ```
4. Upload the file
5. **Expected:** Your resume should appear in the editor with parsed sections

**Troubleshooting:**
- If nothing appears: Check browser console for errors
- If parsing is wrong: The parser is basic - you may need to manually adjust
- For PDF files: Currently shows a message - use TXT files for best results

### 2. Time Tracking Feature

**How to Test:**
1. Go to `http://localhost:3000/editor`
2. Select some text in the document (click and drag)
3. Wait for AI suggestion to appear in the chat
4. Click "Accept" on the suggestion
5. **Expected:** 
   - Header should show "Time saved: X" badge
   - Badge appears in green in the top right

**Verify it's working:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `timeTrackingDebug.viewEvents()`
4. You should see your tracked events
5. Type: `timeTrackingDebug.viewStats('demo-user')`
6. You should see your time saved stats

### 3. Dashboard Features

**How to Test:**
1. Go to `http://localhost:3000/dashboard`
2. **Expected to see:**
   - 4 main stat cards (Total Documents, Documents Edited, AI Suggestions, Time Saved)
   - 4 insight cards (Productivity Score, Achievements, etc.)
   - Recent Documents list
   - Recent Activity feed
   - Time Saved Breakdown chart
   - Achievements section

**To see real data:**
1. First, use the editor and accept some AI suggestions
2. Then go to dashboard
3. Stats should update automatically

**Check localStorage:**
1. Open DevTools (F12)
2. Application → Local Storage → `http://localhost:3000`
3. Look for `timeTrackingEvents` key
4. Click it to see all your tracked events

### 4. AI Chat Feature

**How to Test:**
1. Go to `http://localhost:3000/editor`
2. Select text in the document
3. **Expected:** AI chat should show suggestions
4. Try typing in the chat: "Make this more concise"
5. **Expected:** AI should respond with suggestions

### 5. Document Editing

**How to Test:**
1. In the editor, click on any text
2. Edit it directly
3. **Expected:** Changes should appear immediately
4. Select text and accept AI suggestions
5. **Expected:** Changes should be highlighted and you can accept/reject

## 📋 Feature Checklist

### ✅ Working Features
- [x] File Upload (TXT files)
- [x] Time Tracking
- [x] Dashboard Stats Display
- [x] AI Chat Interface
- [x] Document Editing
- [x] Achievements System
- [x] Time Saved Breakdown

### ⚠️ Limited Features
- [ ] PDF Upload (shows message, needs backend)
- [ ] DOCX Upload (needs conversion library)
- [ ] Real-time collaboration
- [ ] Export to PDF/DOCX (UI exists, needs backend)

## 🐛 Common Issues & Fixes

### Issue: File upload shows nothing
**Fix:**
1. Make sure you're uploading a `.txt` file
2. Check file has content (not empty)
3. Check browser console for errors
4. Try a simple format first (see example above)

### Issue: Time saved shows 0
**Fix:**
1. Make sure you've accepted at least one AI suggestion
2. Check localStorage has events: `localStorage.getItem('timeTrackingEvents')`
3. Refresh the dashboard page
4. Check console for errors

### Issue: Dashboard shows mock data
**Fix:**
1. This is normal - some data is mock (like "Total Documents: 24")
2. Real data (Time Saved, Edits) comes from your actual usage
3. Use the editor to generate real data

### Issue: AI suggestions not appearing
**Fix:**
1. Make sure you've selected text (highlighted it)
2. Wait a moment for the AI to respond
3. Check browser console for errors
4. Try selecting different text

## 🧪 Advanced Testing

### Test Time Tracking with Debug Tools

Open browser console and run:

```javascript
// View all events
timeTrackingDebug.viewEvents()

// View stats
timeTrackingDebug.viewStats('demo-user')

// Create a test event
timeTrackingDebug.createTestEvent()

// Clear all events (for fresh start)
timeTrackingDebug.clearEvents()
```

### Test File Upload with Different Formats

1. **TXT File (Best):**
   - Create a `.txt` file
   - Use the format shown above
   - Should parse correctly

2. **PDF File:**
   - Currently shows a message
   - For production, needs PDF parsing library

3. **DOCX File:**
   - Currently not supported
   - Convert to TXT first

## 📊 Expected Results

After testing for 10 minutes, you should see:
- ✅ At least 1-2 documents uploaded/edited
- ✅ 3-5 AI suggestions accepted
- ✅ Time saved: 5-15 minutes
- ✅ Dashboard showing real stats
- ✅ At least 1 achievement unlocked

## 🎯 Next Steps for Production

1. **Add PDF Parsing:**
   - Use a library like `pdf-parse` or `pdfjs-dist`
   - Add backend endpoint for PDF processing

2. **Add DOCX Support:**
   - Use `mammoth` library for DOCX to HTML conversion
   - Parse HTML to extract text

3. **Connect to Database:**
   - Store events in CosmosDB/PostgreSQL
   - Update API to query database
   - Keep localStorage as cache

4. **Add Real User Auth:**
   - Get user ID from auth context
   - Filter data by authenticated user

5. **Improve Parsing:**
   - Use AI to parse resumes
   - Better structure detection
   - Handle more formats

## 💡 Tips

1. **Start Simple:** Test with a basic TXT file first
2. **Check Console:** Always check browser console for errors
3. **Use Debug Tools:** The debug utilities help verify everything works
4. **Refresh Often:** Some features need page refresh to update
5. **Test Incrementally:** Test one feature at a time

