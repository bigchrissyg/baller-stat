# Baller Stats - Histon Hornets Blue U12

A React + Supabase application for viewing player statistics, match details, and player appearances for the Histon Hornets Blue U12 football team.

## Features

- 📅 **Match Management** - View all matches with scores, dates, and match types
- 👤 **Player Statistics** - Detailed stats for each player including goals, assists, and awards
- 🏟️ **Player Appearances** - See who played in each match and their positions
- 📊 **Aggregate Statistics** - Total minutes played, positions, and performance metrics
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Supabase** - Backend and database
- **Tailwind CSS** - Styling
- **React Router** - Navigation (future)

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase project and API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd baller-stats
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials:
```bash
cp .env.example .env
```

Then update the `.env` file with your Supabase URL and anon key:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Development Server

```bash
npm run dev
```

The application will open automatically at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── Matches.jsx              # Matches list view
│   ├── PlayerStats.jsx          # Player statistics dashboard
│   └── PlayerAppearances.jsx    # Player appearances by match
├── hooks/
│   └── useData.js               # Custom data fetching hooks
├── lib/
│   ├── supabase.js              # Supabase client and data functions
│   └── utils.js                 # Utility functions
├── App.jsx                       # Main app component
├── App.css                       # App styles
├── main.jsx                      # Entry point
└── index.css                     # Global styles
```

## Database Schema

The application works with the following Supabase tables:

- **players** - Player information
- **seasons** - Season details
- **matches** - Match data with scores and details
- **player_appearances** - Player participation in matches with position and time
- **goals** - Goal scoring records with assist information
- **star_player_awards** - Star player awards for matches

## Features by Tab

### Matches Tab
- View all matches in chronological order
- See match type, location, and final scores
- Expand to see match details and penalties (for cup matches)

### Player Stats Tab
- Select any player to view their statistics
- See aggregate stats: matches played, goals, assists, star player awards
- View detailed appearance history with positions and minutes
- Color-coded position badges for easy identification

### Appearances Tab
- View all matches with detailed player lineups
- Organized by match half and time segments
- See position assignments for each player in each time period

## Styling

The application uses Tailwind CSS for styling with a clean, modern design. Color schemes are used to indicate:
- **Goalkeepers (GK)** - Yellow
- **Defenders (CB, LB, RB)** - Blue
- **Midfielders (CM, CDM, CAM, LM, RM)** - Purple/Green
- **Forwards (CF, LF, RF)** - Red

## Future Enhancements

- Advanced filtering and search
- Season selection and comparison
- Export reports to CSV/PDF
- Team formation visualization
- Performance trends and charts
- Player comparison tools
- Match video integration

## Troubleshooting

### "Missing Supabase environment variables"
Make sure you have created a `.env` file with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

### Data not loading
Check your browser console for network errors and ensure your Supabase project has security policies that allow reading the tables. Your anon key needs read permissions.

## License

MIT
