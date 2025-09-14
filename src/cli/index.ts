#!/usr/bin/env node
import { getSurfableHours } from '../domain/get_surfable_hours';
import { SurflineHttpClient } from '../infrastructure/surfline_client/http_client';

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

const main = async () => {
  if (
    process.env.SURFLINE_EMAIL === undefined ||
    process.env.SURFLINE_PASSWORD === undefined
  ) {
    console.error(
      'SURFLINE_EMAIL and SURFLINE_PASSWORD must be set in environment variables',
    );
    process.exit(1);
  }

  const surflineClient = new SurflineHttpClient();
  try {
    await surflineClient.login(
      process.env.SURFLINE_EMAIL,
      process.env.SURFLINE_PASSWORD,
    );
  } catch (error) {
    console.error('Failed to log in to Surfline:', error);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Parse optional --spot argument
  let spotId = '';
  const spotIndex = args.indexOf('--spotId');
  if (spotIndex !== -1) {
    if (spotIndex + 1 >= args.length) {
      console.error('Error: --spotId requires a spotId value.');
      process.exit(1);
    }
    spotId = args[spotIndex + 1];
    args.splice(spotIndex, 2); // Remove --spot and its value from args
  } else {
    throw Error('Error: --spotId argument is required.');
  }

  if (args.includes('--today')) {
    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      surflineClient,
      1,
      now,
    );
    const surfableHoursWithHumanReadableTime = surfableHours.map((hour) => ({
      ...hour,
      humanReadableStartTime: toHumanReadable(hour.startTime),
      humanReadableEndTime: toHumanReadable(hour.endTime),
    }));

    if (surfableHoursWithHumanReadableTime.length === 0) {
      console.log('🌊 No surfable hours found for today.');
      console.log(
        'The conditions might not be favorable for surfing right now.',
      );
    } else {
      console.log(surfableHoursWithHumanReadableTime);
    }
  } else if (args.includes('--tomorrow')) {
    const now = Date.now() / 1000;
    const tomorrowNow = now + 86400; // Add 24 hours in seconds to get tomorrow
    const surfableHours = await getSurfableHours(
      [spotId],
      surflineClient,
      7,
      tomorrowNow,
    );
    const surfableHoursWithHumanReadableTime = surfableHours.map((hour) => ({
      ...hour,
      humanReadableStartTime: toHumanReadable(hour.startTime),
      humanReadableEndTime: toHumanReadable(hour.endTime),
    }));

    console.log('Surfable hours for tomorrow:');
    if (surfableHoursWithHumanReadableTime.length === 0) {
      console.log('🌊 No surfable hours found for tomorrow.');
      console.log(
        'The conditions might not be favorable for surfing tomorrow.',
      );
    } else {
      console.log(surfableHoursWithHumanReadableTime);
    }
  } else if (args.includes('--on')) {
    const onIndex = args.indexOf('--on');
    if (onIndex === -1 || onIndex + 1 >= args.length) {
      console.error(
        'Error: --on requires a date argument in dd/mm/yyyy format.',
      );
      process.exit(1);
    }
    const dateString = args[onIndex + 1];
    if (!isValidDate(dateString)) {
      console.error('Error: Invalid date format. Use dd/mm/yyyy.');
      process.exit(1);
    }
    const [day, month, year] = dateString.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Months are 0-indexed
    const targetNow = date.getTime() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      surflineClient,
      7,
      targetNow,
    );
    const surfableHoursWithHumanReadableTime = surfableHours.map((hour) => ({
      ...hour,
      humanReadableStartTime: toHumanReadable(hour.startTime),
      humanReadableEndTime: toHumanReadable(hour.endTime),
    }));

    console.log(`Surfable hours for ${dateString}:`);
    if (surfableHoursWithHumanReadableTime.length === 0) {
      console.log(`🌊 No surfable hours found for ${dateString}.`);
      console.log(
        'The conditions might not be favorable for surfing on that date.',
      );
    } else {
      console.log(surfableHoursWithHumanReadableTime);
    }
  } else if (args.includes('--week')) {
    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours(
      [spotId],
      surflineClient,
      7,
      now,
    );

    console.log('Surfable hours for the week:');
    console.log('');

    if (surfableHours.length === 0) {
      console.log('🌊 No surfable hours found for the next 7 days.');
      console.log(
        'The conditions might not be favorable for surfing during this period.',
      );
    } else {
      const groupedByDay = groupSurfableHoursByDay(surfableHours);

      // If no days were created (shouldn't happen if surfableHours.length > 0), show all hours
      if (Object.keys(groupedByDay).length === 0) {
        console.log('📋 All surfable hours:');
        surfableHours.forEach((hour) => {
          const surfableHourWithTime = {
            ...hour,
            humanReadableStartTime: toHumanReadable(hour.startTime),
            humanReadableEndTime: toHumanReadable(hour.endTime),
          };
          console.log(
            `🏄 ${surfableHourWithTime.humanReadableStartTime} - ${surfableHourWithTime.humanReadableEndTime}`,
          );
        });
      } else {
        // Sort days chronologically
        const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
          // Extract the first surfable hour timestamp from each day to sort
          const aTimestamp = groupedByDay[a][0]?.startTime || 0;
          const bTimestamp = groupedByDay[b][0]?.startTime || 0;
          return aTimestamp - bTimestamp;
        });

        sortedDays.forEach((day) => {
          console.log(`📅 ${day}:`);
          if (groupedByDay[day].length === 0) {
            console.log('  No surfable hours');
          } else {
            groupedByDay[day].forEach((hour) => {
              const startTime = hour.humanReadableStartTime.split(' ').pop(); // Get just the time part
              const endTime = hour.humanReadableEndTime.split(' ').pop(); // Get just the time part
              console.log(`  🏄 ${startTime} - ${endTime}`);
            });
          }
          console.log('');
        });
      }
    }
  } else {
    console.log('Welcome to surfcal!');
    console.log(
      'Usage: ./surfcal [--spotId spotId] (--today | --tomorrow | --week | --on dd/mm/yyyy)',
    );
  }
};

main();
