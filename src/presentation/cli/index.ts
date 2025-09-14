#!/usr/bin/env node
import { SurflineHttpClient } from '../../infrastructure/surfline_client/http_client';
import { runCLI } from './runner';

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
  const result = await runCLI(args, surflineClient);
  
  if (!result.success) {
    if (result.error) {
      console.error(result.error);
    }
    process.exit(1);
  }
  
  if (result.output) {
    console.log(result.output);
  }
};

main();
