import readline from 'node:readline/promises';

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c(1); const green = c(32); const yellow = c(33); const red = c(31); const dim = c(2);

export const ui = {
  heading: (s) => console.log(bold(s)),
  line: (s) => console.log(s),
  info: (s) => console.log(dim('•'), s),
  ok: (s) => console.log(green('✔'), s),
  warn: (s) => console.error(yellow('!'), s),
  error: (s) => console.error(red('✖'), s),
};

export async function confirm(question) {
  if (!process.stdin.isTTY) return false; // never apply silently in non-interactive shells
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}
