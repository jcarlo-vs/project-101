# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finvy is a personal finance tracker mobile app built with Expo (SDK 54) and React Native. It tracks subscriptions, credit cards, bills, loans, expenses, and income — all stored locally via AsyncStorage (no backend/API).

## Commands

- `npx expo start` — Start dev server (or `npm start`)
- `npx expo start --ios` / `--android` / `--web` — Platform-specific
- `npm run lint` — ESLint via `expo lint`
- No test framework is configured

## Architecture

**Routing:** File-based routing via expo-router. Routes live in `app/`. Tab screens are in `app/(tabs)/`, modal screens (add/edit forms) are top-level in `app/`.

**State management:** React Context + `useReducer` pattern. Each domain has its own context in `context/`:
- `SubscriptionContext`, `CreditCardContext`, `BillContext`, `LoanContext`, `ExpenseContext`, `BudgetContext`, `CurrencyContext`
- Each context handles its own AsyncStorage persistence (load on mount, save on every dispatch)
- Currency conversion is handled by `CurrencyContext` — switching currency converts all stored amounts in every context

**Provider nesting order** (in `app/_layout.tsx`): `CurrencyProvider` wraps everything. Inside `AppContent`: Subscription > CreditCard > Bill > Expense > Budget > Loan > ThemeProvider.

**Data types & theme:** All TypeScript interfaces, category types, color maps, and icon maps are centralized in `constants/theme.ts`. This single file defines: `Theme` design tokens, `Subscription`, `CreditCard`, `Bill`, `Loan`, `Expense`, `IncomeSource` interfaces, category enums with colors/icons, currency list with exchange rates, and billing/reminder types.

**Calculation utilities:** Domain-specific pure functions in `utils/`:
- `calculations.ts` — subscription cost aggregation
- `credit-card-calculations.ts` — utilization, minimum payments, due dates
- `bill-calculations.ts` — monthly bill totals, upcoming bills
- `loan-calculations.ts` — loan payment totals, upcoming payments
- `dashboard-calculations.ts` — cross-domain aggregations (total obligations, total debt)
- `budget-calculations.ts` — expense tracking, income analysis, savings rate
- `notifications.ts` — expo-notifications scheduling
- `exchange-rates.ts` — currency conversion helpers

**Path alias:** `@/*` maps to project root (configured in `tsconfig.json`).

## Key Patterns

- Dark-only UI — `userInterfaceStyle: "dark"` in app.json, background `#0A0A0F`
- Icons use `@expo/vector-icons` Ionicons throughout
- All "add" screens double as "edit" screens — they check for an `id` route param
- Storage keys are prefixed with `@finvy_` (some contexts also migrate from old `@subtrackr_` keys)
- New Architecture and React Compiler are enabled (`app.json` experiments)
- Typed routes enabled (`experiments.typedRoutes: true`)
