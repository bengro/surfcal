#!/usr/bin/env node
import { getSurfableHours } from '../domain/get_surfable_hours';
import { SurflineHttpClient } from '../infrastructure/surfline_client/http_client';

const toHumanReadable = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  return `${weekday}, ${day}/${month}/${year} ${time}`;
};

const main = async () => {
  if (process.env.SURFLINE_EMAIL === undefined || process.env.SURFLINE_PASSWORD === undefined) {
    console.error('SURFLINE_EMAIL and SURFLINE_PASSWORD must be set in environment variables');
    process.exit(1);
  }

  const surflineClient = new SurflineHttpClient();
  try {
    await surflineClient.login(process.env.SURFLINE_EMAIL, process.env.SURFLINE_PASSWORD);
  }
  catch (error) {
    console.error('Failed to log in to Surfline:', error);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.includes('--today')) {
    const spotId = '5842041f4e65fad6a77088ea'; // A default spotId for now
    const now = Date.now() / 1000;
    const surfableHours = await getSurfableHours([spotId], surflineClient, 1, now);
    const surfableHoursWithHumanReadableTime = surfableHours.map((hour) => ({
      ...hour,
      humanReadableStartTime: toHumanReadable(hour.startTime),
      humanReadableEndTime: toHumanReadable(hour.endTime),
    }));

    console.log('Surfable hours for today:');
    console.log(surfableHoursWithHumanReadableTime);
  } else {
    console.log('Welcome to surfcal!');
    console.log('Usage: ./surfcal --today');
  }
};

main();
