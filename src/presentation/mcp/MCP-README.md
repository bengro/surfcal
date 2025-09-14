# Surfcal MCP Server

This document explains how to set up and use the Surfcal MCP (Model Context Protocol) server, which makes your surfing condition data available to AI agents for calendar integration and surf session planning.

## Overview

The Surfcal MCP server exposes your existing CLI functionality as MCP tools and resources, allowing AI agents to:

1. **Query surf conditions** for today, tomorrow, specific dates, or the next 7 days
2. **Access surf spot information** including popular spots with their Surfline IDs
3. **Integrate with calendar systems** to schedule surf sessions during optimal conditions

## Setup

### 1. Environment Variables

Set up your Surfline credentials as environment variables:

```bash
export SURFLINE_EMAIL="your-email@example.com"
export SURFLINE_PASSWORD="your-password"
```

### 2. Build the Project

```bash
npm install
npm run build
```

### 3. MCP Configuration

Add the Surfcal MCP server to your MCP client configuration. For Claude Desktop, add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "surfcal": {
      "command": "node",
      "args": ["/path/to/surfcal/dist/presentation/mcp/server.js"],
      "env": {
        "SURFLINE_EMAIL": "your-email@example.com",
        "SURFLINE_PASSWORD": "your-password"
      }
    }
  }
}
```

Or use the provided configuration template:
```bash
cp mcp-config.json ~/.config/claude-desktop/claude_desktop_config.json
```

## Available Tools

### 1. `get_surfable_hours_today`
Get surfable conditions for today at a specific surf spot.

**Parameters:**
- `spotId` (string, required): Surfline spot ID

**Example:**
```json
{
  "name": "get_surfable_hours_today",
  "arguments": {
    "spotId": "5842041f4e65fad6a7708876"
  }
}
```

### 2. `get_surfable_hours_tomorrow`
Get surfable conditions for tomorrow at a specific surf spot.

**Parameters:**
- `spotId` (string, required): Surfline spot ID

### 3. `get_surfable_hours_week`
Get surfable conditions for the next 7 days at a specific surf spot.

**Parameters:**
- `spotId` (string, required): Surfline spot ID

### 4. `get_surfable_hours_date`
Get surfable conditions for a specific date at a specific surf spot.

**Parameters:**
- `spotId` (string, required): Surfline spot ID
- `date` (string, required): Date in DD/MM/YYYY format

**Example:**
```json
{
  "name": "get_surfable_hours_date",
  "arguments": {
    "spotId": "5842041f4e65fad6a7708876",
    "date": "15/09/2025"
  }
}
```

## Available Resources

### 1. `surfcal://spots/popular`
A JSON resource containing popular surf spots with their Surfline IDs, locations, and descriptions.

### 2. `surfcal://about`
Information about the Surfcal MCP server and its capabilities.

## Surf Condition Filtering

The server applies the same filtering criteria as your CLI:

- **Minimum wave height:** 2 feet
- **Minimum rating:** "Poor to Fair" or better
- **Daylight hours only:** Conditions are filtered to daylight hours based on sunrise/sunset data

## Integration with Calendar Systems

### Example Use Case with Google Calendar MCP

An AI agent can now:

1. **Query surf conditions** using Surfcal MCP tools
2. **Check calendar availability** using Google Calendar MCP
3. **Schedule surf sessions** during optimal conditions when the calendar is free

Example workflow:
```
Agent: "Let me check surf conditions for Malibu this week and schedule sessions when conditions are good and you're available."

1. Call get_surfable_hours_week with Malibu's spotId
2. Call Google Calendar MCP to check availability
3. Create calendar events for optimal surf times when free
```

## Popular Surf Spots

Here are some popular spots with their Surfline IDs for quick reference:

| Spot Name | Surfline ID | Location |
|-----------|-------------|----------|
| Malibu | 5842041f4e65fad6a7708876 | California, USA |
| Pipeline | 5842041f4e65fad6a7708815 | Hawaii, USA |
| Bells Beach | 5842041f4e65fad6a770883d | Victoria, Australia |
| Jeffreys Bay | 5842041f4e65fad6a7708962 | South Africa |

## Testing the MCP Server

### Manual Testing

You can test the MCP server directly:

```bash
# Start the server
node dist/presentation/mcp/server.js

# The server will run on stdio and wait for MCP protocol messages
```

### Integration Testing

Test with an MCP client like Claude Desktop by:

1. Adding the server to your configuration
2. Asking Claude to check surf conditions
3. Verifying the response includes properly formatted surf data

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify SURFLINE_EMAIL and SURFLINE_PASSWORD are set correctly
   - Check that your Surfline account credentials are valid

2. **Invalid Spot ID**
   - Use the popular spots resource to find valid Surfline spot IDs
   - Verify the spot ID format (24-character hexadecimal string)

3. **No Surfable Hours Found**
   - This is normal when conditions don't meet the filtering criteria
   - The server will return a friendly message with wave emoji 🌊

### Logs

The MCP server logs errors to stderr. Check your MCP client logs for detailed error information.

## Development

### Adding New Tools

To add new tools to the MCP server:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Add a case for the tool in the `CallToolRequestSchema` handler
3. Implement the tool method
4. Update this documentation

### Adding New Resources

To add new resources:

1. Add the resource definition to the `ListResourcesRequestSchema` handler
2. Add a case for the resource in the `ReadResourceRequestSchema` handler
3. Update this documentation

## Security Considerations

- Store Surfline credentials securely using environment variables
- Never commit credentials to version control
- Consider using a secrets management system for production deployments
- The MCP server runs with the same permissions as the user, so ensure proper access controls

## License

This MCP server is part of the Surfcal project and follows the same licensing terms.
