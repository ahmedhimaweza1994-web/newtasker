# AI Platform Setup Guide

## Overview
The AI platform integrates with OpenRouter to provide multiple AI model capabilities including:
- Text Chat
- Code Assistant  
- Marketing & SEO
- Image Generation
- Video Generation

## Required Setup

### 1. OpenRouter API Key
The platform requires an OpenRouter API key to function.

**To get your API key:**
1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add it as the `OPENROUTER_API_KEY` environment variable in Replit Secrets

### 2. Database Migration Needed
To support task tracking in AUX sessions, add this field to the aux_sessions table:
```sql
selectedTaskId uuid REFERENCES tasks(id) ON DELETE SET NULL
```

Run: `npm run db:push --force` to apply schema changes

### 3. Configure AI Models  
Once the API key is set, admins can configure AI models at `/ai/settings` with:
- Model selection (from OpenRouter's available models)
- System prompts
- Temperature, Top-P, Max Tokens
- Presence/Frequency penalties

## Features Implemented

### Frontend
- ✅ Task cards redesigned with Trello-like layout
- ✅ Text truncation on cards (60 chars title, 80 chars description)
- ✅ Narrower columns (280px) for better Trello feel
- ✅ Task selector in dashboard (replaces notes textarea)
- ✅ Cleaner, more compact card design

### Backend
- ✅ OpenRouter service integration  
- ✅ Streaming chat responses
- ✅ Usage tracking and logging
- ⏳ Task selection tracking (needs DB migration)

## Usage
After setup, users can access AI features from the sidebar:
- منصة الذكاء الاصطناعي (AI Center)
- Multiple model types available
- Conversation history saved
- Usage analytics tracked
