# Surfcal

Surfcal is a command-line tool and MCP (Model Context Protocol) server that integrates with Surfline to fetch surfable hours for specified surf spots. It can display surfable hours for today, tomorrow, the next 7 days, or a specific date, using data from Surfline's API. The tool supports checking multiple surf spots simultaneously and provides AI-powered surf session scheduling through MCP integration.

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
   GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key  # Optional for calendar integration
   ```

   - `SURFLINE_EMAIL` and `SURFLINE_PASSWORD` are required for authenticating with Surfline's API
   - `GOOGLE_CALENDAR_API_KEY` is optional and enables calendar integration features

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

## Linting

This project uses Prettier for code formatting. You can check for and fix linting issues using the following commands:

- To check for linting errors:

  ```
  npm run lint
  ```

- To automatically fix linting errors:
  ```
  npm run lint:fix
  ```

## Usage

### CLI Tool

After building, use the CLI tool directly. The tool now supports multiple surf spots and calendar integration for comprehensive condition checking:

```
surfcal [--spotId spotId1] [--spotId spotId2] ... [--calendar calendarId1] [--calendar calendarId2] ... [--today | --tomorrow | --week | --on dd/mm/yyyy]
```

### Available Options

- `--spotId`: Surf spot ID (can be used multiple times for comparing spots)
- `--calendar`: Google Calendar ID to filter out busy times (can be used multiple times)
- `--today`: Get surfable hours for today
- `--tomorrow`: Get surfable hours for tomorrow
- `--week`: Get surfable hours for the next 7 days
- `--on dd/mm/yyyy`: Get surfable hours for a specific date

### Single Spot Examples

1. Get surfable hours for today:

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --today
   ```

2. Get surfable hours for tomorrow:

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --tomorrow
   ```

3. Get surfable hours for the next 7 days:

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --week
   ```

4. Get surfable hours for a specific date:
   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --on 15/09/2025
   ```

### Multiple Spot Examples (NEW!)

1. Compare conditions at multiple spots for today:

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708815 --today
   ```

2. Check weekly conditions across multiple California spots:

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708962 --week
   ```

3. Plan a surf trip for a specific date across multiple spots:
   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708815 --spotId 5842041f4e65fad6a770883d --on 20/09/2025
   ```

### Calendar Integration Examples (NEW!)

The CLI now supports Google Calendar integration to mark surfable hours that conflict with your meetings and appointments. Instead of hiding conflicted times, it shows ALL surfable hours with clear visual indicators for calendar conflicts!

1. **Single calendar integration:**

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --calendar benjamin.groehbiel@gmail.com --today
   ```

2. **Multiple calendars (work + personal):**

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --calendar work@company.com --calendar personal@gmail.com --week
   ```

3. **Multiple spots with calendar integration:**

   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708815 --calendar benjamin.groehbiel@gmail.com --tomorrow
   ```

4. **Plan a surf trip with calendar awareness:**
   ```
   surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708962 --calendar work@company.com --calendar personal@gmail.com --on 20/09/2025
   ```

**Note:** Calendar integration requires the `GOOGLE_CALENDAR_API_KEY` environment variable. Without it, the tool works normally but won't show calendar conflict indicators.

### Popular Surf Spot IDs

- **Malibu** (California): `5842041f4e65fad6a7708876`
- **Pipeline** (Hawaii): `5842041f4e65fad6a7708815`
- **Bells Beach** (Australia): `5842041f4e65fad6a770883d`
- **Jeffreys Bay** (South Africa): `5842041f4e65fad6a7708962`

### Output Format

The CLI now provides enhanced output with:

- Clear spot identification (📍 emoji)
- Surfable hours grouped by spot
- Condition details (rating and wave height)
- **Calendar conflict indicators** (NEW!)
- Hierarchical display for better readability

Example output without calendar integration:

```
Surfable hours for the week (2 spots):

📍 Spot: Malibu (5842041f4e65fad6a7708876)
  📅 Monday, 16/09/2025:
    🏄 08:00 - 09:00 (FAIR, 3.2ft)
    🏄 15:00 - 16:00 (GOOD, 4.1ft)

📍 Spot: Pipeline (5842041f4e65fad6a7708815)
  📅 Monday, 16/09/2025:
    🏄 06:30 - 07:30 (VERY_GOOD, 5.8ft)
```

Example output with calendar integration:

```
Surfable hours for today (1 spot) (filtered by 2 calendars):

📍 Spot: Malibu (5842041f4e65fad6a7708876)
  ⚠️ 10:00 - 11:00 (FAIR, 3.2ft) [CALENDAR CONFLICT]
  🏄 14:00 - 15:00 (GOOD, 4.1ft)
  🏄 17:00 - 18:00 (FAIR, 3.5ft)
  ⚠️ 19:00 - 20:00 (GOOD, 4.5ft) [CALENDAR CONFLICT]
```

#### Visual Indicators:

- **🏄 Available**: No calendar conflicts - you're free to surf!
- **⚠️ Conflict**: Overlaps with calendar events - might need to reschedule meetings
- **[CALENDAR CONFLICT]**: Clear text indicator for conflicted times

When calendar integration is active, ALL surfable hours are shown with clear visual indicators so you can make informed decisions about your surf sessions.

If no valid command is provided, the tool displays usage information.

### MCP Server

Surfcal also provides an MCP (Model Context Protocol) server for AI-powered surf session scheduling. This allows AI agents like Claude to access surf condition data and integrate with calendar systems.

#### MCP Server Usage

1. **Start the MCP server:**

   ```
   npm run start:mcp
   ```

2. **Test the MCP server:**
   ```
   npm run test:mcp
   ```

#### MCP Integration

The MCP server provides:

- **Tools**: Get surfable hours for today, tomorrow, week, or specific dates
- **Resources**: Popular surf spots and server information
- **AI Integration**: Works with Claude Desktop and other MCP-compatible clients

For detailed MCP setup instructions, see [SETUP-GUIDE.md](./SETUP-GUIDE.md).

#### Example AI Queries

Once configured with Claude Desktop, you can ask:

- _"Check surf conditions at Malibu for tomorrow and schedule a 2-hour surf session if conditions are good and I'm free"_
- _"Look at surf conditions for the next 7 days at California spots and schedule sessions when waves are 3+ feet"_
- _"Plan my weekend: find the best surf conditions and schedule sessions when I'm available"_

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the CLI tool
- `npm run start:mcp` - Start the MCP server
- `npm test` - Run Jest tests
- `npm run test:mcp` - Test MCP server configuration
- `npm run lint` - Check code formatting
- `npm run lint:fix` - Fix code formatting issues

## Project Structure

The project follows clean architecture principles with a clear separation of concerns:

```
src/
├── application/           # Application services (NEW!)
│   └── surfable_hours_with_calendar_service.ts
├── domain/                # Core business logic
│   ├── get_surfable_hours.ts
│   ├── calendar_filter_service.ts
│   └── types.ts
├── infrastructure/        # External service integrations
│   ├── surfline_client/  # Surfline API client
│   └── google_calendar_client/ # Google Calendar API client
└── presentation/         # User interfaces
    ├── cli/             # Command-line interface
    │   ├── index.ts
    │   └── runner.ts
    └── mcp/             # Model Context Protocol server
        └── server.ts
```

### Key Components

- **Application Layer**: Application services that orchestrate domain and infrastructure components
- **Domain Layer**: Contains the core surf condition logic and calendar filtering rules
- **Infrastructure Layer**: Handles external API integrations (Surfline, Google Calendar)
- **Presentation Layer**: Provides user interfaces (CLI and MCP server)

## Calendar Integration Architecture

The calendar integration feature follows Domain Driven Design principles with a clean separation of concerns:

### Application Services

- **SurfableHoursWithCalendarService**: Orchestrates the combination of Surfline data with Google Calendar conflict marking
- Handles optional calendar integration and graceful fallback when calendar API is unavailable

### Domain Services

- **CalendarFilterService**: Pure domain logic for marking surfable hours with calendar conflicts
- Uses time range overlap detection to identify conflicts between surf sessions and calendar events
- No external dependencies - purely business logic

### Infrastructure Integration

- **GoogleCalendarClient**: Interface for Google Calendar API integration
- **GoogleCalendarHttpClient**: HTTP implementation for production use
- **GoogleCalendarFakeClient**: Test implementation for reliable testing

### Key Features

- **Smart Conflict Detection**: Marks surfable hours that overlap with calendar events using precise time range logic
- **Complete Information**: Shows ALL surfable hours with clear visual indicators for conflicts
- **Multiple Calendar Support**: Can check conflicts against multiple calendars simultaneously (work + personal)
- **Informed Decision Making**: Users can see great surf conditions and decide if they're worth rescheduling meetings
- **Graceful Degradation**: Works without calendar integration for backward compatibility
- **Enhanced Visual Feedback**: Clear emoji and text indicators for conflicted vs. available times

## Surf Condition Filtering

The application filters surf conditions based on:

- **Minimum wave height**: 2 feet
- **Minimum rating**: "Poor to Fair" or better
- **Daylight hours only**: Uses sunrise/sunset data to filter conditions

## License

ISC

## Disclaimer

This project was predominantly written by Cline and Gemini.
