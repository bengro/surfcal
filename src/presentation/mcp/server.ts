#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getSurfableHours } from '../../domain/get_surfable_hours.js';
import { SurflineHttpClient } from '../../infrastructure/surfline_client/http_client.js';
import {
  SurfableHour,
  SurfCriteria,
  DEFAULT_SURF_CRITERIA,
} from '../../domain/types.js';

class SurfcalMCPServer {
  private server: Server;
  private surflineClient: SurflineHttpClient | null = null;
  private spotNameCache = new Map<string, string>();

  constructor() {
    this.server = new Server(
      {
        name: 'surfcal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandling();
  }

  private async initializeSurflineClient(): Promise<void> {
    if (this.surflineClient) {
      return;
    }

    if (!process.env.SURFLINE_EMAIL || !process.env.SURFLINE_PASSWORD) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'SURFLINE_EMAIL and SURFLINE_PASSWORD environment variables are required',
      );
    }

    this.surflineClient = new SurflineHttpClient();
    try {
      await this.surflineClient.login(
        process.env.SURFLINE_EMAIL,
        process.env.SURFLINE_PASSWORD,
      );
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to authenticate with Surfline: ${error}`,
      );
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_surfable_hours_today',
            description: 'Get surfable hours for today at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
                waveMin: {
                  type: 'number',
                  description: 'Minimum wave height in feet (default: 2)',
                  minimum: 0,
                },
                ratingMin: {
                  type: 'string',
                  description: 'Minimum surf rating (default: POOR_TO_FAIR)',
                  enum: [
                    'VERY_POOR',
                    'POOR',
                    'POOR_TO_FAIR',
                    'FAIR',
                    'GOOD',
                    'VERY_GOOD',
                  ],
                },
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_tomorrow',
            description:
              'Get surfable hours for tomorrow at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
                waveMin: {
                  type: 'number',
                  description: 'Minimum wave height in feet (default: 2)',
                  minimum: 0,
                },
                ratingMin: {
                  type: 'string',
                  description: 'Minimum surf rating (default: POOR_TO_FAIR)',
                  enum: [
                    'VERY_POOR',
                    'POOR',
                    'POOR_TO_FAIR',
                    'FAIR',
                    'GOOD',
                    'VERY_GOOD',
                  ],
                },
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_week',
            description:
              'Get surfable hours for the next 7 days at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
                waveMin: {
                  type: 'number',
                  description: 'Minimum wave height in feet (default: 2)',
                  minimum: 0,
                },
                ratingMin: {
                  type: 'string',
                  description: 'Minimum surf rating (default: POOR_TO_FAIR)',
                  enum: [
                    'VERY_POOR',
                    'POOR',
                    'POOR_TO_FAIR',
                    'FAIR',
                    'GOOD',
                    'VERY_GOOD',
                  ],
                },
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_date',
            description:
              'Get surfable hours for a specific date at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
                date: {
                  type: 'string',
                  description: 'Date in DD/MM/YYYY format',
                  pattern: '^\\d{2}/\\d{2}/\\d{4}$',
                },
                waveMin: {
                  type: 'number',
                  description: 'Minimum wave height in feet (default: 2)',
                  minimum: 0,
                },
                ratingMin: {
                  type: 'string',
                  description: 'Minimum surf rating (default: POOR_TO_FAIR)',
                  enum: [
                    'VERY_POOR',
                    'POOR',
                    'POOR_TO_FAIR',
                    'FAIR',
                    'GOOD',
                    'VERY_GOOD',
                  ],
                },
              },
              required: ['spotId', 'date'],
            },
          },
          {
            name: 'search_spots',
            description: 'Search for surf spots by name, region, or location to get their spot IDs',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for surf spot name, region, or location (e.g., "Great Western", "Cornwall", "Malibu")',
                  minLength: 1,
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.initializeSurflineClient();

        switch (name) {
          case 'get_surfable_hours_today':
            return await this.getSurfableHoursToday(
              args?.spotId as string,
              args?.waveMin as number,
              args?.ratingMin as SurfCriteria['minRating'],
            );

          case 'get_surfable_hours_tomorrow':
            return await this.getSurfableHoursTomorrow(
              args?.spotId as string,
              args?.waveMin as number,
              args?.ratingMin as SurfCriteria['minRating'],
            );

          case 'get_surfable_hours_week':
            return await this.getSurfableHoursWeek(
              args?.spotId as string,
              args?.waveMin as number,
              args?.ratingMin as SurfCriteria['minRating'],
            );

          case 'get_surfable_hours_date':
            return await this.getSurfableHoursDate(
              args?.spotId as string,
              args?.date as string,
              args?.waveMin as number,
              args?.ratingMin as SurfCriteria['minRating'],
            );

          case 'search_spots':
            return await this.searchSpots(args?.query as string);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`,
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`,
        );
      }
    });
  }

  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'surfcal://spots/popular',
            mimeType: 'application/json',
            name: 'Popular Surf Spots',
            description: 'A list of popular surf spots with their Surfline IDs',
          },
          {
            uri: 'surfcal://about',
            mimeType: 'text/plain',
            name: 'About Surfcal',
            description:
              'Information about the Surfcal MCP server and its capabilities',
          },
        ],
      };
    });

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case 'surfcal://spots/popular':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    {
                      spots: [
                        {
                          name: 'Malibu',
                          spotId: '5842041f4e65fad6a7708876',
                          location: 'California, USA',
                          description:
                            'Famous right-hand point break in Malibu',
                        },
                        {
                          name: 'Pipeline',
                          spotId: '5842041f4e65fad6a7708815',
                          location: 'Hawaii, USA',
                          description:
                            'World-famous barrel on the North Shore of Oahu',
                        },
                        {
                          name: 'Bells Beach',
                          spotId: '5842041f4e65fad6a770883d',
                          location: 'Victoria, Australia',
                          description:
                            'Iconic Australian surf break near Torquay',
                        },
                        {
                          name: 'Jeffreys Bay',
                          spotId: '5842041f4e65fad6a7708962',
                          location: 'South Africa',
                          description: 'World-class right-hand point break',
                        },
                      ],
                    },
                    null,
                    2,
                  ),
                },
              ],
            };

          case 'surfcal://about':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: `Surfcal MCP Server

This MCP server provides access to comprehensive surf condition data from Surfline. It allows AI agents to:

1. Get surfable hours for today, tomorrow, or a specific date
2. Get surfable hours for the next 7 days
3. Access information about popular surf spots
4. Get detailed wind data including speed, direction, and onshore/offshore classification

Available Tools:
- get_surfable_hours_today: Get today's surfable conditions
- get_surfable_hours_tomorrow: Get tomorrow's surfable conditions  
- get_surfable_hours_week: Get next 7 days of surfable conditions
- get_surfable_hours_date: Get conditions for a specific date
- search_spots: Search for surf spots by name, region, or location to get spot IDs

All tools require a spotId parameter (Surfline spot ID) and optionally accept:
- waveMin: Minimum wave height in feet (default: 2)
- ratingMin: Minimum surf rating (default: POOR_TO_FAIR)

Wind Data Included:
- Wind speed in knots (kts)
- Wind direction in degrees and compass abbreviation
- Wind type classification (offshore, onshore, cross-shore)
- Formatted wind info for easy interpretation

The server filters conditions based on:
- Configurable minimum wave height (default: 2 feet)
- Configurable minimum rating (default: "Poor to Fair" or better)
- Daylight hours only

Environment variables required:
- SURFLINE_EMAIL: Your Surfline account email
- SURFLINE_PASSWORD: Your Surfline account password`,
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Unknown resource: ${uri}`,
            );
        }
      },
    );
  }

  private async getSurfableHoursToday(
    spotId: string,
    waveMin?: number,
    ratingMin?: SurfCriteria['minRating'],
  ) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const criteria: SurfCriteria = {
      minWaveHeight: waveMin ?? DEFAULT_SURF_CRITERIA.minWaveHeight,
      minRating: ratingMin ?? DEFAULT_SURF_CRITERIA.minRating,
    };

    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      1,
      now,
      criteria,
    );

    return {
      content: [
        {
          type: 'text',
          text: await this.formatSurfableHoursResponse(surfableHours, 'today'),
        },
      ],
    };
  }

  private async getSurfableHoursTomorrow(
    spotId: string,
    waveMin?: number,
    ratingMin?: SurfCriteria['minRating'],
  ) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const criteria: SurfCriteria = {
      minWaveHeight: waveMin ?? DEFAULT_SURF_CRITERIA.minWaveHeight,
      minRating: ratingMin ?? DEFAULT_SURF_CRITERIA.minRating,
    };

    const now = Date.now() / 1000;
    const tomorrowNow = now + 86400; // Add 24 hours
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      tomorrowNow,
      criteria,
    );

    return {
      content: [
        {
          type: 'text',
          text: await this.formatSurfableHoursResponse(
            surfableHours,
            'tomorrow',
          ),
        },
      ],
    };
  }

  private async getSurfableHoursWeek(
    spotId: string,
    waveMin?: number,
    ratingMin?: SurfCriteria['minRating'],
  ) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const criteria: SurfCriteria = {
      minWaveHeight: waveMin ?? DEFAULT_SURF_CRITERIA.minWaveHeight,
      minRating: ratingMin ?? DEFAULT_SURF_CRITERIA.minRating,
    };

    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      now,
      criteria,
    );

    return {
      content: [
        {
          type: 'text',
          text: await this.formatSurfableHoursResponse(
            surfableHours,
            'the next 7 days',
          ),
        },
      ],
    };
  }

  private async getSurfableHoursDate(
    spotId: string,
    date: string,
    waveMin?: number,
    ratingMin?: SurfCriteria['minRating'],
  ) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }
    if (!date) {
      throw new McpError(ErrorCode.InvalidParams, 'date is required');
    }

    if (!this.isValidDate(date)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid date format. Use DD/MM/YYYY',
      );
    }

    const criteria: SurfCriteria = {
      minWaveHeight: waveMin ?? DEFAULT_SURF_CRITERIA.minWaveHeight,
      minRating: ratingMin ?? DEFAULT_SURF_CRITERIA.minRating,
    };

    const [day, month, year] = date.split('/');
    const targetDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
    );
    const targetNow = targetDate.getTime() / 1000;

    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      targetNow,
      criteria,
    );

    return {
      content: [
        {
          type: 'text',
          text: await this.formatSurfableHoursResponse(surfableHours, date),
        },
      ],
    };
  }

  private async searchSpots(query: string) {
    if (!query) {
      throw new McpError(ErrorCode.InvalidParams, 'query is required');
    }

    try {
      const searchResults = await this.surflineClient!.searchSpots(query);

      if (searchResults.spots.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 No surf spots found matching "${query}". Try searching with different terms like spot name, region, or country.`,
            },
          ],
        };
      }

      const formattedResults = searchResults.spots.map(spot => ({
        spotId: spot._id,
        name: spot.name,
        region: spot.region,
        country: spot.country,
        coordinates: spot.location.coordinates,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                results: formattedResults,
                count: searchResults.spots.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error searching spots: ${error}`,
      );
    }
  }

  private async formatSurfableHoursResponse(
    surfableHours: SurfableHour[],
    timeframe: string,
  ): Promise<string> {
    if (surfableHours.length === 0) {
      return `🌊 No surfable hours found for ${timeframe}. The conditions might not be favorable for surfing during this period.`;
    }

    const formattedHours = await Promise.all(
      surfableHours.map(async (hour) => {
        const startTime = new Date(hour.startTime * 1000);
        const endTime = new Date(hour.endTime * 1000);

        const formatTime = (date: Date) => {
          return date.toLocaleString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        };

        const spotName = await this.getSpotName(hour.spotId);
        const spotDisplay = this.formatSpotDisplay(spotName, hour.spotId);

        const windInfo = this.formatWindInfo(hour.windSpeed, hour.windDirection, hour.windDirectionType);

        return {
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          condition: hour.condition,
          waveHeight: hour.waveHeight,
          windSpeed: hour.windSpeed,
          windDirection: hour.windDirection,
          windDirectionType: hour.windDirectionType,
          windInfo: windInfo,
          spot: spotDisplay,
          spotId: hour.spotId,
        };
      }),
    );

    return JSON.stringify(
      {
        timeframe,
        surfableHours: formattedHours,
        count: surfableHours.length,
      },
      null,
      2,
    );
  }

  private isValidDate(dateString: string): boolean {
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31 || month < 1 || month > 12) return false;
    return true;
  }

  private async getSpotName(spotId: string): Promise<string> {
    if (this.spotNameCache.has(spotId)) {
      return this.spotNameCache.get(spotId)!;
    }

    try {
      const spotInfo = await this.surflineClient!.getSpotInfo(spotId);
      const spotName = spotInfo.name;
      this.spotNameCache.set(spotId, spotName);
      return spotName;
    } catch (error) {
      console.error(
        `Warning: Could not fetch name for spot ${spotId}, using ID instead`,
      );
      return spotId;
    }
  }

  private formatSpotDisplay(spotName: string, spotId: string): string {
    return spotName === spotId ? spotId : `${spotName} (${spotId})`;
  }

  private formatWindInfo(windSpeed: number, windDirection: number, windDirectionType: string): string {
    const getWindDirectionAbbreviation = (degrees: number): string => {
      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const index = Math.round(degrees / 22.5) % 16;
      return directions[index];
    };

    const formatWindDirectionType = (type: string): string => {
      switch (type.toUpperCase()) {
        case 'OFFSHORE':
        case 'OFFSHORE_WIND':
          return 'offshore';
        case 'ONSHORE':
        case 'ONSHORE_WIND':
          return 'onshore';
        case 'CROSS_SHORE':
        case 'CROSS-SHORE':
        case 'CROSS SHORE':
          return 'cross-shore';
        default:
          return type.toLowerCase();
      }
    };

    const directionAbbr = getWindDirectionAbbreviation(windDirection);
    const formattedType = formatWindDirectionType(windDirectionType);
    
    return `${Math.round(windSpeed)} kts ${directionAbbr} (${formattedType})`;
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Surfcal MCP server running on stdio');
  }
}

async function main() {
  const server = new SurfcalMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
