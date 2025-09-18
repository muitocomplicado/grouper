# AGENTS.md - Development Guidelines

## Build/Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (static site)
- `npm run preview` - Preview production build
- `npm run check` - Type checking with svelte-check
- `npm run check:watch` - Type checking in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting
- `./build.sh [major|minor|patch]` - Deploy script: bumps version, builds, commits, and pushes

## Code Style Guidelines

- **Formatting**: Prettier with tabs, single quotes, no trailing commas, 100 char width
- **TypeScript**: Strict mode enabled, use explicit types
- **Imports**: Use `$lib` alias for internal imports, no unused imports
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Use try-catch for async operations, proper error messages
- **Components**: Svelte 5 syntax, proper TypeScript types for props
- **Styling**: Tailwind CSS with dark mode support, avoid inline styles

## Project Structure

- SvelteKit with static adapter
- TypeScript throughout
- Tailwind CSS for styling
- Components in `src/lib/components/`
- Utilities in `src/lib/utils/`
- Types defined in `src/lib/types.ts`
