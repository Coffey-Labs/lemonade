// Runs the game and the scores service together, so `npm run dev:all` is all
// you need for a working leaderboard on localhost.
import { spawn } from 'node:child_process'

const children = [
  spawn('npm', ['run', 'scores'], { stdio: 'inherit', shell: false }),
  spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: false }),
]

const stop = () => {
  for (const c of children) c.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
for (const c of children) c.on('exit', stop)
