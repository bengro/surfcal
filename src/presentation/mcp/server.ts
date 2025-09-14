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
import { SurfableHour } from '../../domain/types.js';

class SurfcalMCPServer {
  private server: Server;
  private surflineClient: SurflineHttpClient | null = null;

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
      }
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
        'SURFLINE_EMAIL and SURFLINE_PASSWORD environment variables are required'
      );
    }

    this.surflineClient = new SurflineHttpClient();
    try {
      await this.surflineClient.login(
        process.env.SURFLINE_EMAIL,
        process.env.SURFLINE_PASSWORD
      );
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to authenticate with Surfline: ${error}`
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
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_tomorrow',
            description: 'Get surfable hours for tomorrow at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_week',
            description: 'Get surfable hours for the next 7 days at a specific surf spot',
            inputSchema: {
              type: 'object',
              properties: {
                spotId: {
                  type: 'string',
                  description: 'The Surfline spot ID to check conditions for',
                },
              },
              required: ['spotId'],
            },
          },
          {
            name: 'get_surfable_hours_date',
            description: 'Get surfable hours for a specific date at a specific surf spot',
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
              },
              required: ['spotId', 'date'],
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
            return await this.getSurfableHoursToday(args?.spotId as string);

          case 'get_surfable_hours_tomorrow':
            return await this.getSurfableHoursTomorrow(args?.spotId as string);

          case 'get_surfable_hours_week':
            return await this.getSurfableHoursWeek(args?.spotId as string);

          case 'get_surfable_hours_date':
            return await this.getSurfableHoursDate(args?.spotId as string, args?.date as string);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`
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
            description: 'Information about the Surfcal MCP server and its capabilities',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'surfcal://spots/popular':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  spots: [
                    {
                      name: 'Malibu',
                      spotId: '5842041f4e65fad6a7708876',
                      location: 'California, USA',
                      description: 'Famous right-hand point break in Malibu'
                    },
                    {
                      name: 'Pipeline',
                      spotId: '5842041f4e65fad6a7708815',
                      location: 'Hawaii, USA',
                      description: 'World-famous barrel on the North Shore of Oahu'
                    },
                    {
                      name: 'Bells Beach',
                      spotId: '5842041f4e65fad6a770883d',
                      location: 'Victoria, Australia',
                      description: 'Iconic Australian surf break near Torquay'
                    },
                    {
                      name: 'Jeffreys Bay',
                      spotId: '5842041f4e65fad6a7708962',
                      location: 'South Africa',
                      description: 'World-class right-hand point break'
                    }
                  ]
                }, null, 2),
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

This MCP server provides access to surf condition data from Surfline. It allows AI agents to:

1. Get surfable hours for today, tomorrow, or a specific date
2. Get surfable hours for the next 7 days
3. Access information about popular surf spots

Available Tools:
- get_surfable_hours_today: Get today's surfable conditions
- get_surfable_hours_tomorrow: Get tomorrow's surfable conditions  
- get_surfable_hours_week: Get next 7 days of surfable conditions
- get_surfable_hours_date: Get conditions for a specific date

All tools require a spotId parameter (Surfline spot ID).

The server filters conditions based on:
- Minimum wave height of 2 feet
- Minimum rating of "Poor to Fair" or better
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
            `Unknown resource: ${uri}`
          );
      }
    });
  }

  private async getSurfableHoursToday(spotId: string) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      1,
      now
    );

    return {
      content: [
        {
          type: 'text',
          text: this.formatSurfableHoursResponse(surfableHours, 'today'),
        },
      ],
    };
  }

  private async getSurfableHoursTomorrow(spotId: string) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const now = Date.now() / 1000;
    const tomorrowNow = now + 86400; // Add 24 hours
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      tomorrowNow
    );

    return {
      content: [
        {
          type: 'text',
          text: this.formatSurfableHoursResponse(surfableHours, 'tomorrow'),
        },
      ],
    };
  }

  private async getSurfableHoursWeek(spotId: string) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }

    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      now
    );

    return {
      content: [
        {
          type: 'text',
          text: this.formatSurfableHoursResponse(surfableHours, 'the next 7 days'),
        },
      ],
    };
  }

  private async getSurfableHoursDate(spotId: string, date: string) {
    if (!spotId) {
      throw new McpError(ErrorCode.InvalidParams, 'spotId is required');
    }
    if (!date) {
      throw new McpError(ErrorCode.InvalidParams, 'date is required');
    }

    if (!this.isValidDate(date)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid date format. Use DD/MM/YYYY'
      );
    }

    const [day, month, year] = date.split('/');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const targetNow = targetDate.getTime() / 1000;

    const surfableHours = await getSurfableHours(
      [spotId],
      this.surflineClient!,
      7,
      targetNow
    );

    return {
      content: [
        {
          type: 'text',
          text: this.formatSurfableHoursResponse(surfableHours, date),
        },
      ],
    };
  }

  private formatSurfableHoursResponse(surfableHours: SurfableHour[], timeframe: string): string {
    if (surfableHours.length === 0) {
      return `🌊 No surfable hours found for ${timeframe}. The conditions might not be favorable for surfing during this period.`;
    }

    const formattedHours = surfableHours.map((hour) => {
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

      return {
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        condition: hour.condition,
        waveHeight: hour.waveHeight,
        spotId: hour.spotId,
      };
    });

    return JSON.stringify({
      timeframe,
      surfableHours: formattedHours,
      count: surfableHours.length,
    }, null, 2);
  }

  private isValidDate(dateString: string): boolean {
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31 || month < 1 || month > 12) return false;
    return true;
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
