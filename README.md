# FORGE & SHADOW Unified Self-Improvement System

Welcome to the unified self-improvement PWA. This application combines two distinct aesthetic pathways—**FORGE** (warm luxury, leather, brass, cream, charcoal) and **SHADOW** (cybernetic HUD glass, dark minimal, neon blue accents)—into a single, high-fidelity experience. 

The application is built using **React 19**, **TypeScript**, and **Tailwind CSS**. It is fully installable as a Progressive Web App (PWA) with offline capabilities.

---

## 🌌 The Themes

The application implements a custom theme engine that switches between two visual pathways without changing the underlying progress data:

1. **FORGE Theme (`theme-forge`)**
   - **Atmosphere**: Warm Luxury / Disciplined Craftsman.
   - **Visuals**: Gold/brass indicators, obsidian cards with soft gold glows, structured grid borders, and luxury textures.
   - **Typography**: Sora (headings) & Inter (body).
   - **Feeling**: *"I am forging myself."*

2. **SHADOW Theme (`theme-shadow`)**
   - **Atmosphere**: Futuristic HUD Glass / Modern Operator.
   - **Visuals**: Glowing glass boundaries (`hud-glass`), neon blue highlights, minimalist terminal outlines, and a custom cosmic noise shader background.
   - **Typography**: Space Grotesk (headings) & Inter (body).
   - **Feeling**: *"I am becoming stronger."*

The background WebGL shader initializes only in the `SHADOW` theme and fades out smoothly to `opacity: 0` when toggled to `FORGE`, preserving battery and processing power.

---

## 🛠️ Tech Stack & Setup

### Requirements
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)

### Installation
Clone or navigate to the directory and run:
```bash
npm install
```

### Running Locally
To launch the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production & PWA
To build the application and compile the offline service worker assets:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## 📂 Project Architecture

```
forge/
├── public/                 # PWA Manifest & App Icons
├── src/
│   ├── components/         # Shared UI components (WebGL background shader)
│   ├── contexts/           # Application state (Theme state, App game loops)
│   ├── services/           # DB Adapter layer (LocalStorage vs Supabase)
│   ├── utils/              # Calculation formulas (XP curves, Attributes)
│   ├── views/              # Main UI views (Dashboard, Workouts, Nutrition, Progress, Achievements, Settings)
│   ├── App.tsx             # Root page shell and layout wrappers
│   ├── index.css           # CSS Variable configuration and design tokens
│   └── main.tsx            # App mounting logic
├── supabase/
│   └── schema.sql          # DB migration script
├── vite.config.ts          # Vite configuration and PWA manifest builder
└── tailwind.config.js      # Custom theme utility tokens
```

---

## 💾 Database Service (Supabase + LocalStorage Fallback)

The database adapter is configured to automatically run **locally** using `localStorage` if Supabase environment variables are missing. It comes pre-seeded with rich, realistic mock history logs representing the user's progress.

### Live Supabase Sync
To enable live database synchronization:
1. Create a project at [Supabase](https://supabase.com/).
2. Run the SQL statements inside `supabase/schema.sql` in your Supabase SQL Editor to generate the tables and seed achievements.
3. Create a `.env` file in the root of the project with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anonymous-key-here
   ```
4. Restart the development server. The application will print `Supabase backend initialized.` in the developer console.

---

## 🧠 Gamification & Mechanics

The system evaluates your discipline using specific mathematical formulas located in `src/utils/gameEngine.ts`:

- **XP Curve**: Level thresholds scale dynamically.
- **Titles**: Unlocks titles from *Novice* up to *Ascended Master*.
- **Attributes**: Calculates live character stats based on your activity:
  - **Strength**: Unlocked sets and log weight averages.
  - **Discipline**: Daily quest checklist consistency.
  - **Consistency**: Workout frequency logs over time.
  - **Endurance**: Cardiovascular logs and overall session counts.
  - **Agility**: Steps logged in the nutrition journal.
- **Quest Completes**: Completing all 5 daily quests triggers a special particle effect and a Level Up overlay if XP matches thresholds.
