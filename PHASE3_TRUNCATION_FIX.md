# Phase 3 JSON Truncation Fix

## Problem

Phase 3 PRD generation was consistently failing with:
```
SyntaxError: Unexpected end of JSON input
```

The AI response was being truncated mid-stream, leaving incomplete JSON that couldn't be parsed.

### Root Cause

1. **Overly ambitious prompt:** The system prompt requested a "complete markdown PRD with all sections" which caused extremely long responses
2. **Token limit:** Claude models have an 8K output token limit, but the responses were exceeding this
3. **Ineffective repair:** The `repairJSON()` function couldn't reconstruct missing content, only close brackets/braces
4. **Large input context:** Sending all of Phase 1 and Phase 2 data as JSON consumed input tokens, leaving less room for output

## Solution Implemented

### 1. Drastically Reduced Output Requirements

**Before:**
```typescript
"prdMarkdown": "# Complete markdown PRD with all sections..."
```

**After:**
```typescript
"prdMarkdown": "# Brief Executive Summary (MAX 2000 chars)..."
```

**Impact:** Reduced prdMarkdown from potentially 20,000+ characters to 2,000 maximum

### 2. Added Explicit Constraints to Prompt

**New constraints in system prompt:**
```
CRITICAL: Keep your response concise. Focus on structured data over lengthy prose.
The prdMarkdown field should be a brief executive summary (max 2000 chars), not a complete PRD.
```

**New synthesis rules:**
- KEEP CONCISE: Limit entities to top 10-15, flows to 5-8, conflicts to top 5
- OMIT verbose descriptions - use bullet points and short phrases
- ENSURE JSON can close within token limit - prioritize completeness over detail

**User message additions:**
```
**CRITICAL CONSTRAINTS:**
- Response MUST be valid, complete JSON
- Keep prdMarkdown under 2000 characters
- Limit entities to 10-15 max
- Limit userFlows to 5-8 max
- Use concise bullet points, not paragraphs
- ENSURE JSON closes properly within token limit
```

### 3. Set Realistic Token Limit

**Before:**
```typescript
max_tokens: 100000  // Unrealistic, models don't support this
```

**After:**
```typescript
max_tokens: 8192  // Matches Claude's actual output limit
```

### 4. Enhanced JSON Repair Function

**Improvements:**
- Better logging of repair attempts
- Smarter truncation detection
- Improved incomplete content removal
- More detailed console output for debugging

**New features:**
```typescript
// Better truncation detection
const lastCompleteField = repaired.lastIndexOf('",');
if (lastCompleteField > 0) {
  // Find if we're in an object or array
  const afterLastField = repaired.substring(lastCompleteField + 2);
  if (afterLastField.trim().match(/^\s*"[^"]*$/)) {
    // Incomplete next field, truncate
    repaired = repaired.substring(0, lastCompleteField + 1);
  }
}
```

### 5. Emergency Repair with Graceful Degradation

**New error handling:**
```typescript
if (isTruncated) {
  console.warn('Response appears truncated (missing closing braces)');
  // Try one more time with repaired JSON
  try {
    const emergencyRepair = repairJSON(jsonText);
    const parsed = JSON.parse(emergencyRepair) as Phase3Data;
    toast.warning('PRD generated but may be incomplete due to complexity');
    return { ...parsed, generatedAt: new Date().toISOString() };
  } catch (repairError) {
    console.error('Emergency repair failed:', repairError);
  }
}
```

**Benefits:**
- Attempts emergency repair before throwing error
- Shows warning toast if repair succeeds (data may be incomplete)
- Falls back to helpful error message if repair fails

### 6. Improved Error Messages

**Before:**
```
Failed to generate PRD: Response was incomplete. This may be due to the complexity
of your requirements. Try simplifying your transcript or reducing the scope of
artifacts being analyzed.
```

**After:**
```
Failed to generate complete PRD. The response exceeded output limits.
This happens with very complex projects. Try:
• Reducing the number of artifacts in scope
• Simplifying your transcript
• Breaking your project into smaller phases
```

**Improvements:**
- More specific about the actual problem (output limits)
- Actionable bullet points
- Clearer guidance on what to do

---

## Technical Changes

### Files Modified

#### `/src/services/ai.ts`

1. **Import toast:**
   ```typescript
   import { toast } from 'sonner';
   ```

2. **Updated PHASE3_SYSTEM_PROMPT:**
   - Changed prdMarkdown requirement from "complete PRD" to "brief summary (max 2000 chars)"
   - Added explicit conciseness instructions
   - Added synthesis rules for limiting output size

3. **Enhanced repairJSON() function:**
   - Added detailed logging
   - Improved incomplete content detection
   - Better truncation handling

4. **Enhanced generatePRD() error handling:**
   - Added truncation detection
   - Implemented emergency repair attempt
   - Added toast warning for partial success
   - Improved error message with actionable steps

5. **Updated Bedrock call:**
   - Reduced max_tokens from 100000 to 8192
   - Added more explicit constraints in user message

---

## Expected Behavior After Fix

### Success Case (Normal)
1. AI generates concise, complete JSON
2. JSON parses successfully
3. Phase 3 data displayed normally
4. No warnings or errors

### Success Case (Emergency Repair)
1. AI response is slightly truncated
2. repairJSON() successfully closes structures
3. JSON parses after repair
4. Warning toast: "PRD generated but may be incomplete due to complexity"
5. Phase 3 data displayed (may have some missing fields)

### Failure Case (Unrecoverable)
1. AI response is severely truncated
2. repairJSON() cannot repair it
3. Error message displayed with actionable guidance
4. User can:
   - Remove artifacts from scope
   - Simplify transcript
   - Try again with less data

---

## Testing Instructions

### Test 1: Normal Generation
1. Create project with moderate complexity (2-3 artifacts)
2. Complete Phase 1 and Phase 2
3. Let Phase 3 auto-generate
4. **Expected:** Clean generation, no warnings

### Test 2: High Complexity
1. Create project with many artifacts (5+)
2. Complete Phase 1 and Phase 2
3. Let Phase 3 auto-generate
4. **Expected:** Either clean generation OR warning toast with partial data

### Test 3: Very High Complexity
1. Create project with maximum artifacts
2. Very long transcript (5000+ words)
3. Complete Phase 1 and Phase 2
4. Let Phase 3 auto-generate
5. **Expected:** Either warning toast OR helpful error message

### Verification Checklist
- [ ] No "Unexpected end of JSON input" errors
- [ ] Console shows repair attempts if needed
- [ ] Warning toast appears if repair succeeds
- [ ] Error message is clear and actionable if repair fails
- [ ] Phase 3 data displays correctly when successful
- [ ] PRD markdown is concise (not 20,000+ characters)

---

## Monitoring & Debugging

### Console Logs to Watch

**During normal operation:**
```
(No special logs - clean generation)
```

**During repair:**
```
JSON appears truncated. Attempting to close structures...
Open braces: 15, Close braces: 12
Adding 3 closing braces
Repair attempt complete. Repaired length: 45231
```

**During emergency repair:**
```
Response appears truncated (missing closing braces)
Attempting emergency repair...
Emergency repair succeeded!
```

**On failure:**
```
JSON parsing failed. Response length: 52341
Response appears truncated (missing closing braces)
Attempting emergency repair...
Emergency repair failed: SyntaxError...
```

### Key Metrics

- **Response length:** Should be < 30,000 characters typically
- **Repair success rate:** Should be > 80% for truncated responses
- **Failure rate:** Should be < 5% overall

---

## Future Improvements (Not Implemented)

1. **Streaming Response:**
   - Use `InvokeModelWithResponseStreamCommand`
   - Parse JSON incrementally as it streams
   - Update progress in real-time
   - **Effort:** 6-8 hours

2. **Chunked Generation:**
   - Split PRD generation into multiple API calls
   - Generate entities, then flows, then migrations separately
   - Combine results client-side
   - **Effort:** 4-6 hours

3. **Smart Input Reduction:**
   - Summarize Phase 1 and Phase 2 data before sending
   - Only send essential fields
   - Reduce input token usage
   - **Effort:** 2-3 hours

4. **Adaptive Conciseness:**
   - Detect when response is getting too long
   - Dynamically adjust detail level
   - Implement progressive summarization
   - **Effort:** 3-4 hours

5. **Response Validation:**
   - Validate JSON structure before parsing
   - Check for required fields
   - Provide specific feedback on what's missing
   - **Effort:** 2-3 hours

---

## Rollback Plan

If issues occur, revert these commits:
1. Revert ai.ts changes to previous prompt
2. Restore original max_tokens value
3. Remove emergency repair logic
4. Restore original error messages

**Risk:** LOW - Changes are isolated to ai.ts and improve error handling

---

## Success Criteria

✅ No JSON parsing errors for normal-complexity projects
✅ Clear error messages with actionable guidance
✅ Emergency repair works for minor truncation
✅ Response stays within token limits
✅ PRD generation completes successfully > 95% of the time
✅ User experience is smooth and professional
