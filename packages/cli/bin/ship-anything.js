#!/usr/bin/env node
import { main } from '../src/cli.js';

const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error(`ship-anything requires Node.js >= 20 (found ${process.versions.node}).`);
  process.exit(1);
}
process.exitCode = await main(process.argv.slice(2));
