# Phase 3 Truncation Fix - Version 2 (More Aggressive)

## Problem Recap

Even after the initial fix, Phase 3 generation is still hitting truncation issues with complex projects:

```
Error: Expected ',' or '}' after property value in JSON at position 27701
Response length: 27,719 characters
```

The AI was generating ~27K characters of JSON, getting cut off mid-property, resulting in unparseable JSON.

---

## Root Cause

1. **Still too verbose:** Despite constraints, AI generating 27K chars (way over 20K limit)
2. **Ineffective repair:** repairJSON couldn't fix syntax errors from mid-property truncation
3. **No fallback:** Complete failure meant user sees nothing

---

## Solution V2: Ultra-Aggressive Constraints + Fallback

### 1. Drastically Reduced Limits

**Before (V1):**
```
- prdMarkdown: < 2000 chars
- Entities: 10-15
- UserFlows: 5-8
- General guidance to be concise
```

**After (V2):**
```
- Total response: < 20,000 chars (HARD LIMIT)
- prdMarkdown: < 1,000 chars (50% reduction)
- Entities: Exactly 8 (no more)
- UserFlows: Exactly 5 (no more)
- Conflicts: Exactly 3 (no more)
- Each description: 1 line, < 100 chars
```

### 2. Stricter System Prompt

**Added:**
```
**ABSOLUTE REQUIREMENTS (FAILURE TO COMPLY = INVALID OUTPUT):**
1. Total response length: < 20,000 characters
2. prdMarkdown: < 1,000 characters (bullet points only)
3. Entities: Exactly 8, no more
4. UserFlows: Exactly 5, no more
5. Conflicts: Exactly 3, no more
6. DataModel: Exactly 8 entities, 5 fields max each
7. Each description: 1 line, < 100 chars
8. Close all braces properly - test JSON validity before sending
```

### 3. Reduced Token Limit

**Before:**
```typescript
max_tokens: 8192
```

**After:**
```typescript
max_tokens: 6000
```

**Why:** Force the AI to be even more concise. 6000 tokens ≈ 18,000-24,000 characters depending on content.

### 4. Lower Temperature

**Before:**
```typescript
temperature: 0.5
```

**After:**
```typescript
temperature: 0.3
```

**Why:** More deterministic, focused output. Less creative rambling.

### 5. Enhanced Repair Function

**Improvements:**
- Better detection of incomplete properties
- Find last valid complete structure
- More intelligent truncation
- Better logging for debugging

**New logic:**
```typescript
function repairJSON(jsonText: string): string {
  // 1. Find unclosed strings
  const unclosedString = repaired.match(/"[^"]*$/);

  // 2. Find incomplete properties
  const incompleteProperty = repaired.match(/,\s*"[^"]*:\s*"[^"]*$/);

  // 3. Find last good character (", }, or ])
  const lastGoodChar = repaired.substring(0, lastValidPos).search(/["\}\]]\s*$/);

  // 4. Truncate to last good position
  repaired = repaired.substring(0, lastGoodChar + 1);

  // 5. Close structures
  // ... rest of logic
}
```

### 6. Graceful Fallback to Mock Data

**New behavior:**
```typescript
try {
  const emergencyRepair = repairJSON(jsonText);
  const parsed = JSON.parse(emergencyRepair);
  toast.warning('PRD may be incomplete...');
  return parsed;
} catch (repairError) {
  // FALLBACK: Return mock data instead of complete failure
  console.warn('Falling back to template data...');
  toast.error('PRD generation exceeded limits. Showing template data.');
  return {
    ...mockPhase3Data,
    confidence: 0, // Indicate this is mock/template
  };
}
```

**Benefits:**
- User sees SOMETHING rather than complete error
- Clear warning that it's template data (confidence: 0)
- Can still navigate and explore structure
- Better than crashing

---

## Expected Behavior Now

### Scenario 1: Simple Project (Most Common)
- AI generates complete, valid JSON
- Response < 15,000 chars
- No warnings
- ✅ **Success**

### Scenario 2: Medium Complexity
- AI generates near-limit response
- Response ~18,000 chars
- JSON might be slightly truncated
- Emergency repair succeeds
- ⚠️ **Warning:** "PRD may be incomplete..."
- User sees mostly complete data
- ✅ **Acceptable**

### Scenario 3: High Complexity
- AI generates too much
- Response truncated at 20K+
- Emergency repair fails
- Falls back to mock data
- ❌ **Error:** "Showing template data..."
- User sees template but knows it's not real
- Guidance to simplify project
- ✅ **Better than nothing**

---

## Testing Strategy

### Test 1: Simple Project
1. Small transcript (~500 words)
2. 1-2 artifacts
3. **Expected:** Clean generation, no warnings

### Test 2: Medium Project
1. Medium transcript (~1500 words)
2. 3-4 artifacts
3. **Expected:** Either clean OR warning with incomplete data

### Test 3: Complex Project
1. Large transcript (~3000+ words)
2. 5+ artifacts with many columns
3. **Expected:** Either warning OR mock data fallback

### Test 4: Very Complex Project
1. Huge transcript (5000+ words)
2. 10+ artifacts
3. **Expected:** Mock data fallback with clear error

---

## Monitoring

### Console Logs to Watch

**Successful generation:**
```
(no special logs)
```

**Truncation with successful repair:**
```
Response appears truncated (missing closing braces)
Attempting emergency repair...
Starting repair. Original length: 27719
Found unclosed string at end
Structure count: {187/185} [71/69]
Adding 2 closing brackets
Adding 3 closing braces
Repair complete. Final length: 27707
Testing repaired JSON...
Emergency repair succeeded!
```

**Truncation with failed repair (fallback):**
```
Response appears truncated (missing closing braces)
Attempting emergency repair...
Testing repaired JSON...
Emergency repair failed: SyntaxError...
Falling back to template data...
```

### User-Facing Messages

**Success:**
- No toast (silent success)

**Partial success:**
- ⚠️ Warning toast: "PRD generated but may be incomplete due to complexity. Some sections may be missing."

**Fallback:**
- ❌ Error toast: "PRD generation exceeded limits. Showing template data - please simplify your project and try again."

---

## Files Modified

**`src/services/ai.ts`:**
1. Updated PHASE3_SYSTEM_PROMPT with stricter limits
2. Updated synthesis rules to be more aggressive
3. Updated user message with absolute requirements
4. Reduced max_tokens from 8192 to 6000
5. Lowered temperature from 0.5 to 0.3
6. Enhanced repairJSON() function
7. Added fallback to mock data on repair failure

---

## Migration Notes

### For Production

When moving to production, consider:

1. **Implement Streaming API:**
   ```typescript
   const stream = await callBedrockStream({...});
   // Parse JSON incrementally
   // Stop when reaching size limit
   // Return partial but valid JSON
   ```

2. **Split PRD Generation:**
   ```typescript
   // Instead of one huge call:
   const overview = await generateOverview(phase1, phase2);
   const architecture = await generateArchitecture(phase1, phase2);
   const flows = await generateFlows(phase1, phase2);
   // Combine client-side
   ```

3. **Add Retry with Reduced Scope:**
   ```typescript
   try {
     return await generatePRD(phase1, phase2);
   } catch (error) {
     // Retry with simplified input
     const simplified = simplifyPhaseData(phase1, phase2);
     return await generatePRD(simplified.phase1, simplified.phase2);
   }
   ```

---

## Success Criteria

✅ Simple projects generate without warnings (>80% of cases)
✅ Medium projects generate with warning or clean (>95% of cases)
✅ Complex projects fall back gracefully (100% of cases)
✅ No complete failures - always returns something
✅ Clear user guidance on what to do
✅ Mock data fallback has confidence: 0 indicator

---

## Rollback

If issues persist:
1. Increase max_tokens back to 8192
2. Remove fallback to mock data (revert to error)
3. Simplify repair logic
4. Add "Generate Simplified PRD" button as alternative

---

## Recommendations for Users

**For Now:**
- Keep transcripts under 2000 words
- Limit artifacts to 3-4 maximum
- Upload only essential spreadsheets
- Focus on critical business logic

**Future:**
- We'll implement chunked generation (Phase 1)
- Add PRD regeneration with adjustable detail level
- Support incremental PRD building (add sections one by one)

---

## Summary

**What changed:**
- More aggressive output constraints (50% reduction)
- Better JSON repair logic
- Fallback to mock data (graceful degradation)
- Reduced token limit (6000 vs 8192)
- Lower temperature (0.3 vs 0.5)

**Expected outcome:**
- 80% of projects: Clean generation ✅
- 15% of projects: Warning with incomplete data ⚠️
- 5% of projects: Mock data fallback ❌
- 0% of projects: Complete crash ✅✅✅

**Key improvement:**
User ALWAYS sees something useful, with clear feedback about data quality.
