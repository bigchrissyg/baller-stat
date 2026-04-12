# Getting Started with Baller Stats

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

Create a `.env` file in the project root (copy `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project:
- Go to Settings → API
- Copy the Project URL and the `anon` key

### 3. Set Up Supabase Database

Run the SQL from `histon_hornets_blue.sql` in your Supabase SQL editor:
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the entire contents of `histon_hornets_blue.sql`
5. Click "Run"

This will create all tables and seed the data with the Histon Hornets Blue team info.

### 4. Configure Row Level Security (RLS)

For public read access (recommended for a stats dashboard):

For each table (players, seasons, matches, player_appearances, goals, star_player_awards):
1. Go to Authentication → Policies in Supabase
2. For each table, enable RLS and add a policy:
   - Click "New Policy"
   - "For queries with SELECT"
   - "Using expression": Change to blank (allows all)
   - Or use: `(true)` to allow all SELECT queries

Alternatively, keep RLS off if this is for local/internal use only.

### 5. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Using the Application

### Matches Tab
- Browse all matches in reverse chronological order
- See match results, dates, and match types
- Click "View Details" to see more information

### Player Stats Tab
- Select a player from the list
- View their career statistics:
  - Matches played
  - Goals scored
  - Assists provided
  - Star player awards
  - Total minutes played
  - Positions they've played
- Scroll down to see all match appearances with timestamps

### Appearances Tab
- View the full lineup for each match
- Grouped by half (H1/H2)
- Organized by time segments
- Color-coded positions for quick identification

## Building for Production
```bash
npm run build
```

The optimized build will be in the `dist` folder, ready to deploy to any static hosting.

## Key Features Implemented

✅ Real-time data from Supabase  
✅ Player statistics aggregation  
✅ Match history with results  
✅ Player lineup visualization  
✅ Position color coding  
✅ Responsive mobile-friendly design  
✅ Clean, modern UI with Tailwind CSS  

## Data Flow

```
Supabase Database
       ↓
Supabase Client (lib/supabase.js)
       ↓
Custom Hooks (hooks/useData.js)
       ↓
React Components
       ↓
Tailwind CSS Styling
```

## Troubleshooting

**"Cannot find module" errors**
- Run `npm install` again
- Delete `node_modules` and `npm install`

**Data not loading**
- Check that `.env` values are correct
- Verify tables exist in Supabase
- Check browser console for network errors
- Ensure RLS policies allow SELECT access

**Styling looks broken**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart dev server (`npm run dev`)

## Next Steps

1. Deploy to Vercel, Netlify, or GitHub Pages
2. Add season filtering
3. Add player comparison feature
4. Create player detail pages
5. Add data export functionality
6. Integrate with live match updates
