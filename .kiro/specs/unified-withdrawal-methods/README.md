# Unified Withdrawal Methods - Spec Summary

## Overview

This spec consolidates Bank Cards and USDT Wallets management into a single "Withdrawal Methods" page with tab-based navigation, improving UX and reducing menu clutter.

## Status

- ✅ Requirements: Complete
- ✅ Design: Complete
- ✅ Tasks: Complete
- ⏳ Implementation: Not started

## Key Features

1. **Single Menu Item** - Replace 2 menu items with 1 "Withdrawal Methods"
2. **Tab Navigation** - Switch between Bank Cards and USDT Wallets
3. **Code Reuse** - Extract hooks from existing components
4. **No Backend Changes** - Reuse existing APIs
5. **Visual Consistency** - Maintain original designs (blue for banks, purple for USDT)

## Architecture

```
MyPage → WithdrawalMethodsPage
         ├── TabNavigation
         ├── BankCardsTab (reuses BankCardPage logic)
         └── USDTWalletsTab (reuses USDTWalletPage logic)
```

## Implementation Approach

- **MVP Focus**: Optional tasks marked with `*` can be skipped
- **Incremental**: 15 tasks building on each other
- **Testable**: 10 correctness properties with property-based tests
- **Backward Compatible**: No API or database changes

## Quick Start

To begin implementation:

1. Read `requirements.md` for full feature requirements
2. Review `design.md` for architecture and component specs
3. Follow `tasks.md` in order, starting with task 1

## Files

- `requirements.md` - 10 detailed requirements with acceptance criteria
- `design.md` - Architecture, components, data models, correctness properties
- `tasks.md` - 15 implementation tasks with sub-tasks
- `README.md` - This file

## Next Steps

1. Start with Task 1: Create shared hooks
2. Follow tasks sequentially
3. Run tests at checkpoints (tasks 7 and 14)
4. Deploy when all core tasks complete

## Estimated Effort

- Core implementation: 2-3 days
- With all optional tests: 4-5 days
- Total tasks: 15 main + 15 optional sub-tasks

## Success Criteria

- Single "Withdrawal Methods" menu item
- Smooth tab switching
- All existing functionality preserved
- No regressions in withdrawal flow
- Improved user experience

---

**Created:** 2026-01-19
**Feature Name:** unified-withdrawal-methods
**Type:** UI/UX Improvement
