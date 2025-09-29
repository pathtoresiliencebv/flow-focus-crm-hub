# 01 - Quote Popup Elimination

## Problem
- "Nieuwe offerte" button still opens popup dialog instead of dedicated page
- Various form validations show browser alerts
- Poor UX with modal-based workflow

## Current Implementation
- `Quotes.tsx` uses dialog for quote creation
- `MultiBlockQuoteForm` renders inside dialog
- Form validations use alert() calls

## Solution
1. **Remove Dialog from Quotes Component**
   - Replace dialog trigger with navigation to `/quotes/new`
   - Update `QuotesHeader` to use `navigate('/quotes/new')`

2. **Create Dedicated Quote Creation Page**
   - New route: `/quotes/new`
   - Full-page `MultiBlockQuoteForm` implementation
   - Better mobile experience

3. **Update Form Components**
   - Replace all remaining `alert()` calls with toast notifications
   - Ensure form validation doesn't block workflow

## Files to Modify
- `src/components/Quotes.tsx` - Remove dialog state
- `src/components/quotes/QuotesHeader.tsx` - Update navigation
- `src/pages/NewQuote.tsx` - Ensure proper full-page layout
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Remove dialog dependencies

## Implementation Priority
**HIGH** - Critical for popup-free workflow

## Dependencies
None - can be implemented immediately

## Testing
- Click "Nieuwe offerte" → should navigate to `/quotes/new`
- No popups anywhere in quote creation process
- Form validation shows toast messages only