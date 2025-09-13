# Surfcal

Surfcal is a command-line tool that integrates with Surfline to fetch surfable hours for specified surf spots. It can display surfable hours for today, tomorrow, or a given date, using data from Surfline's API.

## Prerequisites

- Node.js version ^18.14.0 or ^20.0.0
- npm (comes with Node.js)

## Setup

1. Clone the repository:
   ```
   git clone git@github.com:bengro/surfcal.git
   cd surfcal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the project root or export the following variables in your shell:
   ```
   SURFLINE_EMAIL=your_surfline_email@example.com
   SURFLINE_PASSWORD=your_surfline_password
   ```
   These are required for authenticating with Surfline's API.

   Note: Depending on your setup, you may also need Google Calendar credentials if extending functionality to calendar integration.

## Build

Compile the TypeScript source code to JavaScript:
```
npm run build
```
This generates the `dist/` directory with compiled JavaScript files.

## Test

Run the test suite using Jest:
```
npm test
```
This executes all unit tests located in the `src/` directory.

## Usage

After building, use the CLI tool directly:

```
surfcal --spotId <spotId> [--today | --tomorrow | --on dd/mm/yyyy]
```

### Examples

1. Get surfable hours for today:
   ```
   surfcal --spotId 584204214e65fad6a7709cef --today
   ```

2. Get surfable hours for tomorrow:
   ```
   surfcal --spotId 584204214e65fad6a7709cef --tomorrow
   ```

3. Get surfable hours for a specific date:
   ```
   surfcal --spotId 584204214e65fad6a7709cef --on 15/09/2025
   ```

If no valid command is provided, the tool displays usage information.

## Project Structure

- `src/cli/index.ts`: Main CLI entry point
- `src/domain/`: Core business logic (e.g., `get_surfable_hours.ts`)
- `src/infrastructure/`: External integrations (Surfline client, Google Calendar client)

## License

ISC

## Disclaimer

This project was predominantly written by Cline and Gemini.