# Heen en Terug Score App

A digital scorekeeper for our family's favorite card game "Heen en Terug" (There and Back).

## About the Game

"Heen en Terug" is a Dutch trick-taking card game similar to Oh Hell or Wizard. The game is played with a standard deck of cards and involves:

- Players bidding on how many tricks they think they'll win in each round
- A changing number of cards dealt each round (hence the name "There and Back")
- Different trump suits for each round
- Scoring based on accurately predicting your tricks

## Features

- 📱 Mobile-friendly interface for easy use during game nights
- 🎮 Complete game management:
  - Create new games with custom player names
  - Track bids and tricks for each round
  - Automatic score calculation
  - Leaderboard with player rankings
- 📊 Game statistics and analysis
- 📷 Share game standings as images
- 🎲 Game simulation capabilities
- 💰 Calculates monetary winnings/losses (just for fun!)

## Requirements

- Modern web browser with JavaScript and WebAssembly support
- No server or backend required - all game data is stored in the URL
- Internet connection only needed for initial loading

## Local Development Setup

### Prerequisites

1. **Rust Toolchain**:
   - Install [Rust](https://www.rust-lang.org/tools/install)
   - Add WebAssembly target:
     ```bash
     rustup update stable
     rustup target add wasm32-unknown-unknown
     rustup default stable
     ```

2. **Node.js**:
   - Recommended version: 22.x
   - Install from [Node.js website](https://nodejs.org/) or use a version manager

### Installation

```bash
# Clone the repository
git clone https://github.com/raymondkroon/heen-en-terug-score-app.git

# Navigate to the project directory
cd heen-en-terug-score-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Open the app in your browser (default: http://localhost:5173)
2. Create a new game and add player names
3. For each round:
   - View the number of cards and trump suit
   - Enter each player's bid
   - After playing the round, enter the actual tricks won
   - Scores are calculated automatically
4. Continue until all rounds are complete
5. View the final standings and celebrate the winner!

## Building for Production

```bash
# Build the app for production
npm run build

# For GitHub Pages deployment (with base path)
npm run build -- --base=/heen-en-terug-score-app/

# Preview the production build
npm run preview
```

The GitHub Pages deployment uses a base path (`/heen-en-terug-score-app/`). If you're deploying to a different environment, you may need to adjust the base path accordingly.

## Hosting

The application is hosted and available at:
[raymond.k3n.nl/heen-en-terug-score-app](https://raymond.k3n.nl/heen-en-terug-score-app)

Since the app has no backend and all game state is stored in the URL, you can share a game by simply sharing the URL with other players.

## Family Game Night

This app was created specifically for our family card evenings to replace paper scoresheets and make game nights more enjoyable. It's designed to be simple enough for everyone to use, from grandparents to kids!

## Technologies Used

- [Svelte](https://svelte.dev/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Rust](https://www.rust-lang.org/) - For game simulation logic and serialization
- [WebAssembly](https://webassembly.org/) - For running Rust code in the browser
- [Chart.js](https://www.chartjs.org/) - For statistics visualization
- [html-to-image](https://github.com/bubkoo/html-to-image) - For sharing game standings

## License

This project is private and intended for family use only.

## Author

Raymond Kroon
