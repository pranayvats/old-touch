# Audit: what to fix next in Old Touch

Login, community posts and events now work end to end. The weakest part of the app today is the **Emergency flow** — the one feature an older user must be able to trust. That is the recommended next step, before any Social work.

## What the audit found

**1. Emergency is the most broken flow (highest value)**
- The six "What is wrong?" buttons (heart problem, fainted, severe pain, breathing problem, injury, other) all go to the same screen and the choice is thrown away. Nothing records it, nothing is shown to the person being called.
- There is no way to add, edit or remove emergency contacts after the first setup screen. Setup accepts exactly one contact, typed as free text into a single box, and only on first use. If the number was mistyped or the person changes, the user is stuck forever.
- The Emergency screen has no visible "Call 112" — the user has to pick a symptom first, which is an extra step in the worst possible moment.
- The Emergency screen's Back button is fine, but the symptom list has no "I don't know" shortcut to help.

**2. Healthy Food is a fake screen**
Three hard-coded restaurants with Directions and Call buttons that do nothing when tapped. A dead button is worse than no button for this audience.

**3. Smaller accessibility gaps**
- No text-size control in an app aimed at older eyes; theme follows the phone only.
- Errors appear as small red text rather than a clear, spoken-language message with a retry.
- No profile/settings screen, so the town, name and contacts entered at setup can never be changed.

## Recommended next step: make Emergency trustworthy

Build an Emergency contacts manager plus a symptom-aware help screen.

1. **Emergency contacts screen** (reachable from Emergency and from a new Profile screen): list saved contacts, add a contact with separate Name / Relationship / Phone fields and number validation, edit, delete, and mark one as primary.
2. **Carry the symptom through.** Tapping a symptom passes it to the help screen, which shows it in large text at the top ("Breathing problem — get help now") so the user can read it aloud to whoever answers.
3. **Call 112 first.** Put the red Call 112 button at the top of the Emergency screen itself, above the symptom list, so help is always one tap away.
4. **Log the alert** in a new `emergency_alerts` table (user, symptom, time) so later versions can notify family and show history.

### Why this before Social
Emergency is the app's core promise and the reason a family would install it. It is currently the only flow where a user can hit a dead end with no recovery (wrong number saved, no way to fix it). Social adds new surface area on top of a foundation that is not yet reliable.

## Technical notes
- New routes: `/emergency/contacts`, `/profile`. Pass the symptom to `/emergency/contact` via a typed search param.
- New table `emergency_alerts` (id, user_id, symptom, created_at) with grants and RLS scoped to `auth.uid()`; extend `emergency_contacts` with `is_primary`.
- Move contact entry out of `setup.tsx`'s free-text parsing into the reusable contact form; keep setup working by reusing that form.

## Suggested order after this
1. Emergency contacts + symptom-aware help (this plan)
2. Real nearby restaurants for Healthy Food, reusing the existing map search
3. Profile/settings and a text-size control
4. Social
