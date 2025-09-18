# Grouper

A modern web application for creating and managing balanced groups of people. Built with SvelteKit, TypeScript, and Tailwind CSS.

## Features

- **Person Management**: Add people with names, gender (M/F), leader status, and family/network numbers
- **Smart Group Generation**: Automatically create balanced groups based on configurable settings
- **Group Settings**: Control group size, gender separation, and leader requirements
- **Visual Interface**: Clean, responsive design with dark mode support
- **Export Functionality**: Copy generated groups as formatted text
- **Mobile Optimized**: Keyboard-aware layout for mobile devices
- **Real-time Validation**: Prevent duplicate names and validate input

## Development

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or your preferred package manager

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser (optional)
npm run dev -- --open
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (static site)
- `npm run preview` - Preview production build locally
- `npm run check` - Run TypeScript and Svelte type checking
- `npm run check:watch` - Type checking in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting
- `./deploy.sh [major|minor|patch]` - Deploy script: bumps version, builds, commits, and pushes

## Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

The application will be built as a static site in the `build/` directory, ready for deployment to any static hosting service.

## Technology Stack

- **Frontend**: SvelteKit with Svelte 5
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with dark mode support
- **Build Tool**: Vite
- **Deployment**: Static adapter for hosting flexibility

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── utils/         # Utility functions
│   ├── stores.ts      # Svelte stores for state management
│   ├── types.ts       # TypeScript type definitions
│   └── index.ts       # Main exports
├── routes/            # SvelteKit routes
├── app.css           # Global styles
└── app.html          # HTML template
```

## Code Style

- **Formatting**: Prettier with tabs, single quotes, 100 character line width
- **Naming**: PascalCase for components, camelCase for functions/variables
- **TypeScript**: Strict mode enabled with explicit typing
- **Components**: Svelte 5 syntax with proper TypeScript prop types
