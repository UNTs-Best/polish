                                                                           
  ---                                                                                                                                                                
  Build a full-stack web application called Polish — an AI-powered document editor for creating and polishing professional documents like resumes and cover letters. 
                                                                                                                                                                     
  Theme / Design Tokens                                                                                                                                              
                                                                                                                                                                     
  - Background/base: #f5f2edff                                                                                                                                         
  - Body text: #1D1D1B
  - Headings / accent: #5119c8ff                                                                                                                                       
  - Foreground / primary: #3cb4ffff                                                                                                                                    
   
  Use these colors consistently across all components. Clean, minimal, editorial aesthetic.                                                                          
                  
  ---                                                                                                                                                                
  Pages to Build  
                                                                                                                                                                     
  1. Landing Page
                                                                                                                                                                     
  - Navbar: Logo ("Polish"), nav links (Home, Pricing), and CTA buttons (Login, Get Started)                                                                         
  - Hero section: headline, subheadline, and a prominent "Get Started" button
  - Features section: highlight AI editing, version history, multi-format export                                                                                     
  - Pricing section: two tiers (Free, Pro) with feature comparison                                                                                                   
  - Footer                                                                                                                                                           
                                                                                                                                                                     
  2. Login Page                                                                                                                                                      
                  
  - Email + password form                                                                                                                                            
  - OAuth tiles: "Sign in with Google", "Sign in with Apple", "Sign in with GitHub" (UI only, wire up later)
  - Link to sign up page                                                                                                                                             
                  
  3. Sign Up Page                                                                                                                                                    
                  
  - Name, email, password fields                                                                                                                                     
  - Same OAuth tiles as login
  - Link back to login                                                                                                                                               
                  
  4. Dashboard Page

  - Top navbar with logo, user avatar/menu                                                                                                                           
  - Grid of document cards showing: title, document type (resume / cover letter), last edited date
  - "New Document" button (opens a modal or navigates to editor)                                                                                                     
  - Empty state if no documents yet                                                                                                                                  
                                                                                                                                                                     
  5. Document Editor Page                                                                                                                                            
                  
  - Left sidebar: document list / navigation, version history panel (list of snapshots with timestamps), export options (PDF, DOCX)                                  
  - Main area: rich text / markdown editor (contenteditable or textarea-based)
  - Right sidebar / floating panel: AI tools                                                                                                                         
    - "Improve Writing" button                                                                                                                                       
    - "Get Suggestions" button                                                                                                                                       
    - "Score Quality" button (shows score 1–10 + issues/strengths)                                                                                                   
    - "Summarize" button                                                                                                                                             
    - AI chat panel (collapsible) with message thread and input box
  - Inline prompt bar: appears on text selection with quick actions (Rewrite, Shorten, Expand)                                                                       
  - Top bar: document title (editable), save status indicator, export button                                                                                         
                                                                                                                                                                     
  ---                                                                                                                                                                
  API Scaffolding                                                                                                                                                    
                                                                                                                                                                     
  Stub all API calls — do not implement real logic, just define the functions so they can be wired to a backend later.
                                                                                                                                                                     
  // auth                                                                                                                                                            
  POST /api/auth/register                                                                                                                                            
  POST /api/auth/login                                                                                                                                               
  POST /api/auth/logout
  POST /api/auth/refresh
  GET  /api/auth/me                                                                                                                                                  
   
  // documents                                                                                                                                                       
  GET    /api/docs
  POST   /api/docs
  GET    /api/docs/:id
  PUT    /api/docs/:id
  DELETE /api/docs/:id                                                                                                                                               
   
  // versions                                                                                                                                                        
  GET  /api/versions/document/:documentId
  POST /api/versions/document/:documentId/restore/:versionId
  GET  /api/versions/compare/:versionId1/:versionId2
                                                                                                                                                                     
  // AI / LLM
  POST /api/llm/documents/:documentId/suggestions                                                                                                                    
  POST /api/llm/documents/:documentId/apply-suggestions
  GET  /api/llm/documents/:documentId/summary                                                                                                                        
  GET  /api/llm/documents/:documentId/quality
                                                                                                                                                                     
  // OAuth        
  GET /api/oauth/google/url
  GET /api/oauth/github/url                                                                                                                                          
  GET /api/oauth/apple/url
                                                                                                                                                                     
  ---             
  Tech Preferences
                                                                                                                                                                     
  - React + TypeScript
  - Tailwind CSS for styling (use the design tokens above as custom colors)                                                                                          
  - Shadcn/UI or Radix UI for components                                                                                                                             
  - React Router or Next.js app router for navigation                                                                                                                
  - Use localStorage as a temporary data store until the real API is connected                                                                                       
                                                                                                                                                                     
  ---                                                                                                                                                                
                   