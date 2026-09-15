# Old Touch App

Build the first version of my mobile app called “Old Touch”. IMPORTANT: This is a REAL MOBILE APP, not a desktop website and not a website pretending to be an app. The final app will eventually be published on Google Play Store for Android and Apple App Store for iPhone. Use a mobile-first architecture that can later be packaged with Capacitor for Android and iOS.

APP PURPOSE: Old Touch is a simple social/community app designed mainly for older people in India. It helps them communicate with people they know locally, discover nearby activities, create events, find useful places, and quickly access emergency/health features.

DESIGN: Extremely simple and accessible for older adults. Phone screen is the primary design target. Use large text, large buttons/tap targets, high contrast, simple familiar icons, clear labels, minimal navigation, very little clutter, no unnecessary animations, and obvious Back buttons. Make it feel like a polished real mobile application.

HOME SCREEN: Create a straight vertical list of large options in this exact order: 1. EMERGENCY 2. HOST AN EVENT 3. MY COMMUNITY 4. NEAR ME 5. HEALTHY FOOD 6. BOOK A CAB. Make EMERGENCY visually very prominent with a red emergency-style button/ribbon.

EMERGENCY: When tapped, show a screen with large choices: Heart problem, Fainted, Severe pain, Breathing problem, Injury, Other. For now these only navigate to a placeholder emergency-contact screen. Do NOT use AI to make medical decisions or decide whether something is an emergency.

HOST AN EVENT: Create the beginning of the event creation flow. Screen 1 title “Name the Event”, with a large text input and placeholder “Meet up at 7 pm on 17th September”. The eventual AI will understand dates/times from natural language, but do not implement AI yet. Screen 2 should contain Event name, Description, Date, Start time, End time, Location, Invite people. Description is optional.

MY COMMUNITY: Create a placeholder community screen showing example local/community posts with community name, person name, post text, and time/date.

NEAR ME: Create a placeholder screen for nearby useful places. Eventually this will use Google Maps/Places. Show categories: Hospitals, Pharmacies, Restaurants, Community places, Events.

HEALTHY FOOD: Create a placeholder nearby restaurant screen. Eventually it will use Google Maps/Places. Results can eventually contain Restaurant name, Distance, Rating, Open/closed, Directions, Call.

BOOK A CAB: Create a simple placeholder cab screen. Eventually integrate with Uber. For now show “Choose where you want to go”, a destination input, and a placeholder button “Open Uber”.

TECHNICAL REQUIREMENTS FOR THIS FIRST STAGE: Do NOT implement authentication, database, Supabase, Google Maps, AI API, Uber API, push notifications, real emergency calling, or payments. Focus only on UI, navigation, mobile responsiveness, accessibility, and clean code structure. Create reusable components for large buttons, navigation, cards, form fields, page headers, and Back buttons. Keep the project organized so we can add Supabase, Google Maps, Gemini AI, notifications, emergency functionality, and Uber later without rebuilding the whole app. Do not add unnecessary features. The app should feel like a real mobile app already, even though backend functionality will be added later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/436a80e1-2b81-42da-a34e-406b8e5f8e23).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
