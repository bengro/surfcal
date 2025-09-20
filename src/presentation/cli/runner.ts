import { getSurfableHours } from '../../domain/get_surfable_hours';
import { SurflineClient } from '../../infrastructure/surfline_client/surfline_client';
import { GoogleCalendarClient } from '../../infrastructure/google_calendar_client/google_calendar_client';
import { SurfableHoursWithCalendarService } from '../../application/surfable_hours_with_calendar_service';
import { SurfCriteria, DEFAULT_SURF_CRITERIA } from '../../domain/types';

// Cache for spot names to avoid repeated API calls
const spotNameCache = new Map<string, string>();

const getSpotName = async (
  spotId: string,
  surflineClient: SurflineClient,
): Promise<string> => {
  if (spotNameCache.has(spotId)) {
    return spotNameCache.get(spotId)!;
  }

  try {
    const spotInfo = await surflineClient.getSpotInfo(spotId);
    const spotName = spotInfo.name;
    spotNameCache.set(spotId, spotName);
    return spotName;
  } catch (error) {
    console.warn(
      `Warning: Could not fetch name for spot ${spotId}, using ID instead`,
    );
    return spotId;
  }
};

const formatSpotDisplay = (spotName: string, spotId: string): string => {
  return spotName === spotId ? spotId : `${spotName} (${spotId})`;
};

const formatWindDirection = (degrees: number): string => {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const formatWindInfo = (
  windSpeed: number,
  windDirection: number,
  windDirectionType: string,
): string => {
  const directionAbbr = formatWindDirection(windDirection);
  const windTypeText =
    windDirectionType === 'OFFSHORE'
      ? 'offshore'
      : windDirectionType === 'ONSHORE'
        ? 'onshore'
        : 'cross-shore';
  return `Wind: ${Math.round(windSpeed)} kts ${directionAbbr} (${windTypeText})`;
};

const toHumanReadable = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${weekday}, ${day}/${month}/${year} ${time}`;
};

const toDateString = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${weekday}, ${day}/${month}/${year}`;
};

const groupSurfableHoursByDay = (surfableHours: any[]) => {
  const grouped: { [key: string]: any[] } = {};

  surfableHours.forEach((hour) => {
    const dayKey = toDateString(hour.startTime);
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push({
      ...hour,
      humanReadableStartTime: toHumanReadable(hour.startTime),
      humanReadableEndTime: toHumanReadable(hour.endTime),
    });
  });

  return grouped;
};

const isValidDate = (dateString: string): boolean => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (day < 1 || day > 31 || month < 1 || month > 12) return false;
  return true;
};

export interface CLIResult {
  success: boolean;
  output: string;
  error?: string;
}

export const runCLI = async (
  args: string[],
  surflineClient: SurflineClient,
  googleCalendarClient?: GoogleCalendarClient,
): Promise<CLIResult> => {
  try {
    // Clear spot name cache for each run
    spotNameCache.clear();

    let output = '';
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Capture console output
    console.log = (...args: any[]) => {
      output += args.join(' ') + '\n';
    };
    console.error = (...args: any[]) => {
      output += args.join(' ') + '\n';
    };
    console.warn = (...args: any[]) => {
      output += args.join(' ') + '\n';
    };

    try {
      // Parse multiple --spotId, --calendar, and surf criteria arguments
      const spotIds: string[] = [];
      const calendarIds: string[] = [];
      let waveMin: number | undefined;
      let ratingMin: SurfCriteria['minRating'] | undefined;
      let i = 0;
      while (i < args.length) {
        if (args[i] === '--spotId') {
          if (i + 1 >= args.length) {
            return {
              success: false,
              output: '',
              error: 'Error: --spotId requires a spotId value.',
            };
          }
          spotIds.push(args[i + 1]);
          args.splice(i, 2); // Remove --spotId and its value from args
        } else if (args[i] === '--calendar') {
          if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
            return {
              success: false,
              output: '',
              error: 'Error: --calendar requires a calendar ID value.',
            };
          }
          calendarIds.push(args[i + 1]);
          args.splice(i, 2); // Remove --calendar and its value from args
        } else if (args[i] === '--wave-min') {
          if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
            return {
              success: false,
              output: '',
              error: 'Error: --wave-min requires a numeric value (feet).',
            };
          }
          const waveValue = parseFloat(args[i + 1]);
          if (isNaN(waveValue) || waveValue < 0) {
            return {
              success: false,
              output: '',
              error: 'Error: --wave-min must be a positive number.',
            };
          }
          waveMin = waveValue;
          args.splice(i, 2); // Remove --wave-min and its value from args
        } else if (args[i] === '--rating-min') {
          if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
            return {
              success: false,
              output: '',
              error: 'Error: --rating-min requires a rating value.',
            };
          }
          const ratingValue = args[
            i + 1
          ].toUpperCase() as SurfCriteria['minRating'];
          const validRatings: SurfCriteria['minRating'][] = [
            'VERY_POOR',
            'POOR',
            'POOR_TO_FAIR',
            'FAIR',
            'GOOD',
            'VERY_GOOD',
          ];
          if (!validRatings.includes(ratingValue)) {
            return {
              success: false,
              output: '',
              error: `Error: --rating-min must be one of: ${validRatings.join(', ')}.`,
            };
          }
          ratingMin = ratingValue;
          args.splice(i, 2); // Remove --rating-min and its value from args
        } else {
          i++;
        }
      }

      // Create surf criteria with defaults or user-specified values
      const criteria: SurfCriteria = {
        minWaveHeight: waveMin ?? DEFAULT_SURF_CRITERIA.minWaveHeight,
        minRating: ratingMin ?? DEFAULT_SURF_CRITERIA.minRating,
      };

      // Create calendar service if calendar IDs are provided
      const calendarService = new SurfableHoursWithCalendarService(
        surflineClient,
        googleCalendarClient,
      );

      // Helper function to get surfable hours with optional calendar filtering
      const getSurfableHoursWithCalendar = async (
        spotIds: string[],
        days: number,
        now: number,
      ) => {
        return await calendarService.getSurfableHoursWithCalendarFiltering({
          spotIds,
          days,
          now,
          calendarIds: calendarIds.length > 0 ? calendarIds : undefined,
          criteria,
        });
      };

      // Check if this is a help request (no spotIds and no command flags)
      const hasCommandFlag =
        args.includes('--today') ||
        args.includes('--tomorrow') ||
        args.includes('--week') ||
        args.includes('--on');

      if (spotIds.length === 0 && hasCommandFlag) {
        return {
          success: false,
          output: '',
          error: 'Error: At least one --spotId argument is required.',
        };
      }

      if (args.includes('--today')) {
        const now = Date.now() / 1000;
        const surfableHours = await getSurfableHoursWithCalendar(
          spotIds,
          1,
          now,
        );
        const surfableHoursWithHumanReadableTime = surfableHours.map(
          (hour) => ({
            ...hour,
            humanReadableStartTime: toHumanReadable(hour.startTime),
            humanReadableEndTime: toHumanReadable(hour.endTime),
          }),
        );

        const calendarText =
          calendarIds.length > 0
            ? ` (filtered by ${calendarIds.length} calendar${calendarIds.length > 1 ? 's' : ''})`
            : '';
        console.log(
          `Surfable hours for today (${spotIds.length} spot${spotIds.length > 1 ? 's' : ''})${calendarText}:`,
        );
        if (surfableHoursWithHumanReadableTime.length === 0) {
          console.log('🌊 No surfable hours found for today.');
          const reason =
            calendarIds.length > 0
              ? 'The conditions might not be favorable for surfing or you have calendar conflicts.'
              : 'The conditions might not be favorable for surfing right now.';
          console.log(reason);
        } else {
          // Group by spot for better readability
          const groupedBySpot = surfableHoursWithHumanReadableTime.reduce(
            (acc, hour) => {
              if (!acc[hour.spotId]) {
                acc[hour.spotId] = [];
              }
              acc[hour.spotId].push(hour);
              return acc;
            },
            {} as { [spotId: string]: any[] },
          );

          for (const [spotId, hours] of Object.entries(groupedBySpot)) {
            const spotName = await getSpotName(spotId, surflineClient);
            const spotDisplay = formatSpotDisplay(spotName, spotId);
            console.log(`\n📍 Spot: ${spotDisplay}`);
            hours.forEach((hour) => {
              const conflictIndicator = hour.calendarConflict ? '⚠️ ' : '🏄 ';
              const conflictSuffix = hour.calendarConflict
                ? ' [CALENDAR CONFLICT]'
                : '';
              const windInfo = formatWindInfo(
                hour.windSpeed,
                hour.windDirection,
                hour.windDirectionType,
              );
              console.log(
                `  ${conflictIndicator}${hour.humanReadableStartTime} - ${hour.humanReadableEndTime} (${hour.condition}, ${hour.waveHeight}ft, ${windInfo})${conflictSuffix}`,
              );
            });
          }
        }
      } else if (args.includes('--tomorrow')) {
        const now = Date.now() / 1000;
        const tomorrowNow = now + 86400; // Add 24 hours in seconds to get tomorrow
        const surfableHours = await getSurfableHoursWithCalendar(
          spotIds,
          7,
          tomorrowNow,
        );
        const surfableHoursWithHumanReadableTime = surfableHours.map(
          (hour) => ({
            ...hour,
            humanReadableStartTime: toHumanReadable(hour.startTime),
            humanReadableEndTime: toHumanReadable(hour.endTime),
          }),
        );

        const calendarText =
          calendarIds.length > 0
            ? ` (filtered by ${calendarIds.length} calendar${calendarIds.length > 1 ? 's' : ''})`
            : '';
        console.log(
          `Surfable hours for tomorrow (${spotIds.length} spot${spotIds.length > 1 ? 's' : ''})${calendarText}:`,
        );
        if (surfableHoursWithHumanReadableTime.length === 0) {
          console.log('🌊 No surfable hours found for tomorrow.');
          const reason =
            calendarIds.length > 0
              ? 'The conditions might not be favorable for surfing or you have calendar conflicts.'
              : 'The conditions might not be favorable for surfing tomorrow.';
          console.log(reason);
        } else {
          // Group by spot for better readability
          const groupedBySpot = surfableHoursWithHumanReadableTime.reduce(
            (acc, hour) => {
              if (!acc[hour.spotId]) {
                acc[hour.spotId] = [];
              }
              acc[hour.spotId].push(hour);
              return acc;
            },
            {} as { [spotId: string]: any[] },
          );

          for (const [spotId, hours] of Object.entries(groupedBySpot)) {
            const spotName = await getSpotName(spotId, surflineClient);
            const spotDisplay = formatSpotDisplay(spotName, spotId);
            console.log(`\n📍 Spot: ${spotDisplay}`);
            hours.forEach((hour) => {
              const conflictIndicator = hour.calendarConflict ? '⚠️ ' : '🏄 ';
              const conflictSuffix = hour.calendarConflict
                ? ' [CALENDAR CONFLICT]'
                : '';
              const windInfo = formatWindInfo(
                hour.windSpeed,
                hour.windDirection,
                hour.windDirectionType,
              );
              console.log(
                `  ${conflictIndicator}${hour.humanReadableStartTime} - ${hour.humanReadableEndTime} (${hour.condition}, ${hour.waveHeight}ft, ${windInfo})${conflictSuffix}`,
              );
            });
          }
        }
      } else if (args.includes('--on')) {
        const onIndex = args.indexOf('--on');
        if (onIndex === -1 || onIndex + 1 >= args.length) {
          return {
            success: false,
            output: '',
            error: 'Error: --on requires a date argument in dd/mm/yyyy format.',
          };
        }
        const dateString = args[onIndex + 1];
        if (!isValidDate(dateString)) {
          return {
            success: false,
            output: '',
            error: 'Error: Invalid date format. Use dd/mm/yyyy.',
          };
        }
        const [day, month, year] = dateString.split('/');
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        ); // Months are 0-indexed
        const targetNow = date.getTime() / 1000;
        const surfableHours = await getSurfableHoursWithCalendar(
          spotIds,
          7,
          targetNow,
        );
        const surfableHoursWithHumanReadableTime = surfableHours.map(
          (hour) => ({
            ...hour,
            humanReadableStartTime: toHumanReadable(hour.startTime),
            humanReadableEndTime: toHumanReadable(hour.endTime),
          }),
        );

        const calendarText =
          calendarIds.length > 0
            ? ` (filtered by ${calendarIds.length} calendar${calendarIds.length > 1 ? 's' : ''})`
            : '';
        console.log(
          `Surfable hours for ${dateString} (${spotIds.length} spot${spotIds.length > 1 ? 's' : ''})${calendarText}:`,
        );
        if (surfableHoursWithHumanReadableTime.length === 0) {
          console.log(`🌊 No surfable hours found for ${dateString}.`);
          const reason =
            calendarIds.length > 0
              ? 'The conditions might not be favorable for surfing or you have calendar conflicts.'
              : 'The conditions might not be favorable for surfing on that date.';
          console.log(reason);
        } else {
          // Group by spot for better readability
          const groupedBySpot = surfableHoursWithHumanReadableTime.reduce(
            (acc, hour) => {
              if (!acc[hour.spotId]) {
                acc[hour.spotId] = [];
              }
              acc[hour.spotId].push(hour);
              return acc;
            },
            {} as { [spotId: string]: any[] },
          );

          for (const [spotId, hours] of Object.entries(groupedBySpot)) {
            const spotName = await getSpotName(spotId, surflineClient);
            const spotDisplay = formatSpotDisplay(spotName, spotId);
            console.log(`\n📍 Spot: ${spotDisplay}`);
            hours.forEach((hour) => {
              const conflictIndicator = hour.calendarConflict ? '⚠️ ' : '🏄 ';
              const conflictSuffix = hour.calendarConflict
                ? ' [CALENDAR CONFLICT]'
                : '';
              const windInfo = formatWindInfo(
                hour.windSpeed,
                hour.windDirection,
                hour.windDirectionType,
              );
              console.log(
                `  ${conflictIndicator}${hour.humanReadableStartTime} - ${hour.humanReadableEndTime} (${hour.condition}, ${hour.waveHeight}ft, ${windInfo})${conflictSuffix}`,
              );
            });
          }
        }
      } else if (args.includes('--week')) {
        const now = Date.now() / 1000;
        const surfableHours = await getSurfableHoursWithCalendar(
          spotIds,
          7,
          now,
        );

        const calendarText =
          calendarIds.length > 0
            ? ` (filtered by ${calendarIds.length} calendar${calendarIds.length > 1 ? 's' : ''})`
            : '';
        console.log(
          `Surfable hours for the week (${spotIds.length} spot${spotIds.length > 1 ? 's' : ''})${calendarText}:`,
        );
        console.log('');

        if (surfableHours.length === 0) {
          console.log('🌊 No surfable hours found for the next 7 days.');
          const reason =
            calendarIds.length > 0
              ? 'The conditions might not be favorable for surfing or you have calendar conflicts.'
              : 'The conditions might not be favorable for surfing during this period.';
          console.log(reason);
        } else {
          // Group by spot first, then by day
          const groupedBySpot = surfableHours.reduce(
            (acc, hour) => {
              if (!acc[hour.spotId]) {
                acc[hour.spotId] = [];
              }
              acc[hour.spotId].push({
                ...hour,
                humanReadableStartTime: toHumanReadable(hour.startTime),
                humanReadableEndTime: toHumanReadable(hour.endTime),
              });
              return acc;
            },
            {} as { [spotId: string]: any[] },
          );

          for (const [spotId, hours] of Object.entries(groupedBySpot)) {
            const spotName = await getSpotName(spotId, surflineClient);
            const spotDisplay = formatSpotDisplay(spotName, spotId);
            console.log(`📍 Spot: ${spotDisplay}`);

            const groupedByDay = groupSurfableHoursByDay(hours);

            if (Object.keys(groupedByDay).length === 0) {
              console.log('  No surfable hours for this spot');
            } else {
              // Sort days chronologically
              const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
                const aTimestamp = groupedByDay[a][0]?.startTime || 0;
                const bTimestamp = groupedByDay[b][0]?.startTime || 0;
                return aTimestamp - bTimestamp;
              });

              sortedDays.forEach((day) => {
                console.log(`  📅 ${day}:`);
                if (groupedByDay[day].length === 0) {
                  console.log('    No surfable hours');
                } else {
                  groupedByDay[day].forEach((hour) => {
                    const startTime = hour.humanReadableStartTime
                      .split(' ')
                      .pop();
                    const endTime = hour.humanReadableEndTime.split(' ').pop();
                    const conflictIndicator = hour.calendarConflict
                      ? '⚠️ '
                      : '🏄 ';
                    const conflictSuffix = hour.calendarConflict
                      ? ' [CALENDAR CONFLICT]'
                      : '';
                    const windInfo = formatWindInfo(
                      hour.windSpeed,
                      hour.windDirection,
                      hour.windDirectionType,
                    );
                    console.log(
                      `    ${conflictIndicator}${startTime} - ${endTime} (${hour.condition}, ${hour.waveHeight}ft, ${windInfo})${conflictSuffix}`,
                    );
                  });
                }
              });
            }
            console.log('');
          }
        }
      } else {
        console.log('Welcome to surfcal!');
        console.log(
          'Usage: ./surfcal [--spotId spotId1] [--spotId spotId2] ... [--calendar calendarId1] [--calendar calendarId2] ... [--wave-min feet] [--rating-min rating] (--today | --tomorrow | --week | --on dd/mm/yyyy)',
        );
        console.log('');
        console.log('Examples:');
        console.log(
          '  Single spot:     ./surfcal --spotId 5842041f4e65fad6a7708876 --today',
        );
        console.log(
          '  Multiple spots:  ./surfcal --spotId 5842041f4e65fad6a7708876 --spotId 5842041f4e65fad6a7708815 --week',
        );
        console.log(
          '  With calendar:   ./surfcal --spotId 5842041f4e65fad6a7708876 --calendar my@email.com --today',
        );
        console.log(
          '  Custom criteria: ./surfcal --spotId 5842041f4e65fad6a7708876 --wave-min 3 --rating-min FAIR --today',
        );
        console.log(
          '  Full example:    ./surfcal --spotId 5842041f4e65fad6a7708876 --calendar cal1@gmail.com --wave-min 4 --rating-min GOOD --week',
        );
        console.log('');
        console.log('Options:');
        console.log(
          '  --spotId      Surf spot ID (can be used multiple times)',
        );
        console.log(
          '  --calendar    Google Calendar ID to filter out busy times (can be used multiple times)',
        );
        console.log('  --wave-min    Minimum wave height in feet (default: 2)');
        console.log(
          '  --rating-min  Minimum surf rating (default: POOR_TO_FAIR)',
        );
        console.log(
          '                Valid ratings: VERY_POOR, POOR, POOR_TO_FAIR, FAIR, GOOD, VERY_GOOD',
        );
        console.log('  --today       Show surfable hours for today');
        console.log('  --tomorrow    Show surfable hours for tomorrow');
        console.log('  --week        Show surfable hours for the next 7 days');
        console.log(
          '  --on DATE     Show surfable hours for a specific date (dd/mm/yyyy)',
        );
        console.log('');
        console.log('Popular spot IDs:');
        console.log('  Malibu:        5842041f4e65fad6a7708876');
        console.log('  Pipeline:      5842041f4e65fad6a7708815');
        console.log('  Bells Beach:   5842041f4e65fad6a770883d');
        console.log('  Jeffreys Bay:  5842041f4e65fad6a7708962');
      }

      return {
        success: true,
        output: output.trim(),
      };
    } finally {
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
