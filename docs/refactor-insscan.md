Read [](file:///home/aa/Projects/insscan/docs)

Saya akan print rencana refactoring dalam format markdown yang bisa Anda copy langsung:

```markdown
# Refactoring Plan: INScann HsCodeScanner Flow

## Ringkasan Eksekutif

Component `HsCodeScanner.jsx` telah menjadi "God Component" dengan ~900 lines yang mencampurkan presentation, state management, stream parsing, dan business logic. Refactoring ini akan memecahnya menjadi custom hooks + service layer yang testable dan maintainable.

**Timeline Estimasi**: 2-3 sprint (depending on testing rigor)  
**Breaking Changes**: None — behavioral parity maintained

---

## 5 Isu Utama

| # | Isu | Dampak | Status |
|---|-----|--------|--------|
| 1 | HsCodeScanner = God Component (~900 lines) | Sulit di-test, sulit dipahami, sulit di-extend | 🔴 Critical |
| 2 | State bloated (20+ useState) | Memory overhead, hard to track dependencies | 🔴 Critical |
| 3 | Utility functions berantakan di bottom file | Tidak testable, tidak reusable | 🟡 High |
| 4 | Error handling ad-hoc (pakai `alert()`) | Sulit extend ke toast/notification library | 🟡 High |
| 5 | Business logic tercampur (stream parsing, progress calc) | Render-blocking, hard to optimize | 🟠 Medium |

---

## Rencana Refactoring (7 Fase)

### Fase 1: Extract Configuration & Constants
**Output**: 2 files  
**Lines of code moved**: ~50

```
📁 app/presentation/components/features/
  └── hs-code-scanner.config.js  [NEW]
      ├── BASE_CHUNK_SIZE
      ├── MIN_CHUNK_SIZE
      ├── MAX_CHUNK_ATTEMPTS
      ├── CHUNK_RETRY_DELAY_MS
      └── CHUNK_GROW_SUCCESS_STREAK

📁 app/infrastructure/constants/
  └── error-messages.js  [NEW]
      ├── VALIDATION_ERROR_MESSAGES
      ├── API_ERROR_MESSAGES
      └── SUCCESS_MESSAGES
```

**Benefit**: Centralized config, easy to tweak without touching component logic.

---

### Fase 2: Extract Utility Functions
**Output**: 3 files  
**Lines of code moved**: ~200

```
📁 app/infrastructure/utils/
  ├── stream-parser.js  [NEW]
  │   └── consumeProgressStream()  [moved from HsCodeScanner]
  │
  ├── formatters.js  [NEW]
  │   ├── formatDuration()
  │   ├── formatEtaClock()
  │   ├── formatDelta()
  │   ├── labelMode()
  │   └── formatProgressLog()
  │
  └── validators.js  [NEW]
      ├── extractHsCodes()
      ├── resolveChunkSize()
      └── validateHsCodeInput()
```

**Benefit**: Reusable utilities, individually testable.

---

### Fase 3: Extract Custom Hooks ⭐ KUNCI
**Output**: 5 hooks  
**Lines of code moved**: ~500

```
📁 app/presentation/hooks/
  ├── useSingleHsCodeFetch.js  [NEW]
  │   └── Encapsulate: singleInput, singleResult, singleStatus, 
  │                   isSingleLoading, handleSingleFetch
  │
  ├── useFileHsCodeFetch.js  [NEW]
  │   └── Encapsulate: fileData, resultData, status, isLoading,
  │                   handleFileChange, handleFetchData
  │       Special: Handles adaptive chunking logic
  │
  ├── useProgressTracking.js  [NEW]
  │   └── Encapsulate: progress state, calculations
  │       Exports: createInitialProgressState(), updateProgress()
  │
  ├── useStreamProgress.js  [NEW]
  │   └── Handle: stream reading, event parsing, progress callbacks
  │       Exports: consumeAndTrackProgress()
  │
  └── useErrorHandler.js  [NEW]
      └── Encapsulate: error/success notifications
          Exports: { showError(), showSuccess(), showWarning() }
          Future: Easy to swap alert() → toast library
```

**Benefit**: Separation of concerns. Each hook is unit-testable.

---

### Fase 4: Create Error Handling Layer
**Output**: 2 files  
**Lines of code moved**: ~100

```
📁 app/presentation/hooks/
  └── useErrorHandler.js  [NEW]
      ├── showError(message, type)
      ├── showSuccess(message)
      └── showWarning(message)
      
📁 app/presentation/components/
  └── ErrorBoundary.jsx  [NEW]
      └── Fallback UI jika component crash
```

**Benefit**: Future-proof untuk migrate ke toast library tanpa ubah component logic.

---

### Fase 5: Split Component Structure
**Output**: 5 new components + 1 refactored main  
**Complexity reduction**: 900 lines → 200 lines + separated concerns

```
📁 app/presentation/components/features/
  ├── HsCodeScanner.jsx  [REFACTORED]
  │   └── ~200 lines (only orchestration + mode switching)
  │
  ├── SingleHsCodeInput.jsx  [NEW]
  │   └── ~80 lines (single mode UI + logic)
  │
  ├── FileHsCodeInput.jsx  [NEW]
  │   └── ~70 lines (file mode UI + logic)
  │
  └── sub-components/
      ├── SingleResultCard.jsx  [EXTRACTED]
      ├── ProgressPanel.jsx  [EXTRACTED]
      ├── LartasSectionCard.jsx  [EXTRACTED]
      ├── InfoBadge.jsx  [EXTRACTED]
      └── index.js  [NEW - export all]
```

**Benefit**: Smaller components = easier to understand, test, reuse.

---

### Fase 6: Create API Service Layer
**Output**: 1 service + dependency injection  
**Lines of code moved**: ~50

```
📁 app/presentation/services/
  └── hs-code-api.service.js  [NEW]
      ├── fetchSingle(code) → Promise<Result>
      ├── fetchMultiple(codes, options) → Promise<Stream>
      └── Error handling at API level
```

**Benefit**: Decouple component from API details. Easy to mock in tests.

---

### Fase 7: Progress Streaming Refactor
**Output**: Custom hook integration  
**No new files**: Menggunakan hooks dari Fase 3 + service dari Fase 6

```
Flow After:
Component → useFileHsCodeFetch hook
          → hs-code-api.service
          → useStreamProgress hook (handles stream events)
          → useProgressTracking hook (state management)
          → useErrorHandler hook (notifications)
```

**Benefit**: Clear data flow, no mixing of concerns.

---

## File Checklist

### To Create
- [ ] `app/presentation/components/features/hs-code-scanner.config.js`
- [ ] `app/infrastructure/constants/error-messages.js`
- [ ] `app/infrastructure/utils/stream-parser.js`
- [ ] `app/infrastructure/utils/formatters.js`
- [ ] `app/infrastructure/utils/validators.js`
- [ ] `app/presentation/hooks/useSingleHsCodeFetch.js`
- [ ] `app/presentation/hooks/useFileHsCodeFetch.js`
- [ ] `app/presentation/hooks/useProgressTracking.js`
- [ ] `app/presentation/hooks/useStreamProgress.js`
- [ ] `app/presentation/hooks/useErrorHandler.js`
- [ ] `app/presentation/services/hs-code-api.service.js`
- [ ] `app/presentation/components/features/SingleHsCodeInput.jsx`
- [ ] `app/presentation/components/features/FileHsCodeInput.jsx`
- [ ] `app/presentation/components/features/sub-components/SingleResultCard.jsx`
- [ ] `app/presentation/components/features/sub-components/ProgressPanel.jsx`
- [ ] `app/presentation/components/features/sub-components/LartasSectionCard.jsx`
- [ ] `app/presentation/components/features/sub-components/InfoBadge.jsx`
- [ ] `app/presentation/components/features/sub-components/index.js`

### To Refactor
- [ ] `app/presentation/components/features/HsCodeScanner.jsx` (reduce to orchestration only)

### To Delete (content moved)
- [ ] Remove utility functions from bottom of HsCodeScanner.jsx
- [ ] Remove state definitions and consolidate to hooks

---

## Verification Checklist

### Functional Tests
- [ ] Single mode: search HS code → display card result (unchanged behavior)
- [ ] File mode: upload Excel → fetch data → display matrix (unchanged behavior)
- [ ] Progress bar updates in real-time (unchanged behavior)
- [ ] Chunk size adapts on connection instability (unchanged behavior)
- [ ] Error messages display correctly (via new error handler)

### Code Quality
- [ ] Each hook is <150 lines
- [ ] Each component is <200 lines
- [ ] No circular dependencies between hooks
- [ ] All utilities have JSDoc comments
- [ ] Service layer has consistent error handling

### Testing (Future)
- [ ] `useSingleHsCodeFetch.test.js` — mock API, test state updates
- [ ] `useFileHsCodeFetch.test.js` — mock Excel parsing, test chunking logic
- [ ] `stream-parser.test.js` — test event parsing, partial data handling
- [ ] `formatters.test.js` — test duration/time formatting
- [ ] `hs-code-api.service.test.js` — mock fetch, test error scenarios

### Performance
- [ ] No new re-renders (hooks using proper dependency arrays)
- [ ] Stream processing unchanged
- [ ] Memory usage same or better (smaller components)

---

## Architectural Decisions

### ✅ Custom Hooks vs Context API
**Decision**: Custom hooks  
**Reason**: Single feature scope, prop drilling is acceptable, avoids Context overhead

### ✅ Service Layer Pattern
**Decision**: Dedicated `hs-code-api.service.js`  
**Reason**: Matches existing Gateway pattern (see `insw-api.service.js`), easier to mock + test

### ✅ Adaptive Chunking Logic Location
**Decision**: Keep in `useFileHsCodeFetch` hook  
**Reason**: Complex but specific to file mode, shouldn't be in presentation component

### ✅ Error Handler Abstraction
**Decision**: Custom hook + optional replacement  
**Reason**: Future-proof for toast library migration without touching components

### ✅ Progress State Management
**Decision**: Dedicated hook + service callback pattern  
**Reason**: Encapsulates ETA calculations, elapsed time, streak tracking

### ⚠️ No Breaking Changes
**Decision**: 100% behavioral parity with current implementation  
**Reason**: Existing users unaffected, easy to rollback if issues found

---

## Known Limitations & Future Work

### Session 1 (This Refactoring)
- Focus on structural improvement only
- No new features added
- No TypeScript migration (separate task)

### Session 2 (Potential Follow-ups)
1. **Request Cancellation**: Add AbortController for cleanup on unmount
2. **Result Caching**: sessionStorage for duplicate file uploads (UX improvement)
3. **Toast Notifications**: Swap `useErrorHandler` from alert() to toast library
4. **Type Safety**: Migrate to TypeScript + JSDoc validation
5. **Stream Optimization**: Consider resumable uploads for very large files

---

## Timeline & Dependencies

```
Phase 1 ── Phase 2 ── Phase 3 ──┐
                                ├── Phase 5 (depends on 1,2,3,4)
                     Phase 4 ───┤
                                ├── Phase 6 (depends on 3,5)
                                │
                     Phase 7 (depends on 3,5,6)
```

**Sequential recommendation**:
1. Phases 1-2: ~2 hours (config + utils extraction)
2. Phase 3: ~4 hours (hook extraction + testing)
3. Phase 4: ~1 hour (error handler)
4. Phase 5: ~3 hours (component splitting)
5. Phase 6: ~1 hour (service layer)
6. Phase 7: ~1 hour (integration + testing)

**Total estimate**: 12 hours (1.5 days) for full refactoring

---

## Implementation Notes

### Testing Strategy
- Test hooks with `@testing-library/react`
- Test services with mocked fetch
- Test utilities with Jest
- Component snapshot tests post-refactor to verify UI unchanged

### Git Strategy
- 1 branch per phase
- PR review after phase 3 (before splitting components)
- Final PR for phases 5-7 together

### Rollback Plan
If issues found: Quick rollback to pre-refactored version via git revert

---

## Questions & Clarifications Needed

1. **Request Interruption Handling** — Currently chunks auto-reduce on failure. Add AbortController for cleanup on unmount?
   - [ ] Yes, do it in Phase 7
   - [ ] Later, separate task

2. **Result Caching** — Store results in sessionStorage to avoid re-fetching same file?
   - [ ] Yes, add to Phase 5
   - [ ] No, not needed

3. **Error Notification Library** — Plan to migrate from `alert()` to toast library?
   - [ ] Yes, build abstraction now (Phase 4 does this)
   - [ ] Maybe, keep flexible

4. **TypeScript Migration** — Scope for this refactoring?
   - [ ] No, JavaScript only
   - [ ] Add JSDoc for future migration

---

## Author Notes

- Plan created: April 28, 2026
- Based on Clean Architecture principles (existing in project)
- Follows existing patterns in codebase (Gateway, Use Cases, Presenters)
- Zero behavioral changes — pure structural improvement
```

Saya sudah print rencana lengkapnya. Sekarang Anda bisa:

1. **Copy-paste ke file** `docs/REFACTORING_INSCANN.md` 
2. **Reference nanti** saat mulai implementasi
3. **Update checklist** saat progress

Rencana sudah tersimpan di `/memories/session/plan.md` juga untuk reference conversation kali ini.

Siap kapan saja lanjut implementasi! 🚀