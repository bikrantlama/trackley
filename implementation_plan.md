# Premium Release Finalization Plan

This plan addresses the final set of UI/UX issues and technical bugs to ensure a perfect premium release of Trackley Lifestyle.

## User Review Required

> [!IMPORTANT]
> - **FAB Position:** I am moving the Finance FAB significantly higher (`bottom: 110`) to ensure it's not blocked by the tab bar / slider.
> - **Friend Verification:** I will implement a basic "Search" feature for the Circle to find real users in Firestore, rather than just adding manual placeholders, to satisfy the "verified name" requirement.
> - **Keyboard Avoidance:** I will adjust the `KeyboardAvoidingView` offsets in Profile and Friends screens to ensure inputs are never obscured on smaller devices.

## Proposed Changes

---

### [Component] Core Context & Persistence

#### [MODIFY] [AppContext.tsx](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/context/AppContext.tsx)
- Ensure all functional state updates (`spendCoins`, `purchaseBorder`, `activateBoost`, `redeemCode`) trigger the `save()` method to persist changes to Firestore/AsyncStorage.
- Add "Circle" sync logic to ensure friend names and stats are verified against Firebase user records.

### [Component] UI/UX Polish

#### [MODIFY] [ProfileScreen.tsx](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/features/profile/ProfileScreen.tsx)
- Refine the `KeyboardAvoidingView` behavior for the Settings Modal.
- Implement more robust padding for input fields when the keyboard is active.

#### [MODIFY] [FinanceScreen.tsx](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/features/finance/FinanceScreen.tsx)
- Update `fab` style: change `bottom: 40` to `bottom: 110`.

#### [MODIFY] [StoreScreen.tsx](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/features/store/StoreScreen.tsx)
- Remove "e.g." from the `TextInput` placeholder in the Redeem section.
- Add new premium themes to the store list.

### [Component] Theme Expansion

#### [MODIFY] [themes.ts](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/constants/themes.ts)
- Add 3 new premium themes:
  - **Cyberpunk 2077**: Bold Yellow, Black, and Cyber Blue.
  - **Deep Sea**: Elegant dark blues and glowing Cyan.
  - **Royal Velvet**: Prestigious Purple and Gold accents.

### [Component] Circle (Social)

#### [MODIFY] [FriendsScreen.tsx](file:///c:/Users/ACER/OneDrive/Desktop/Trackley%20Lifestyle/features/social/FriendsScreen.tsx)
- Implement a real-time user search in the "Add Friend" modal to ensure "verified" names.
- Update UI to distinguish between "Verified Friends" (real users) and "Local Rivals" (manually added).

---

## Verification Plan

### Automated Tests
- N/A (Manual visual and functional verification required for React Native UI).

### Manual Verification
- **Keyboard Test:** Verify that text inputs in Profile and Friends screens are not covered by the keyboard.
- **Persistence Test:** Unlock a theme, restart the app, and verify it stays unlocked.
- **Theme Test:** Apply all new themes and verify the UI looks premium and consistent.
- **FAB Test:** Ensure the "+" button in Finance is fully visible and clickable above the navigation area.
