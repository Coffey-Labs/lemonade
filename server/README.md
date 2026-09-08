# Lemonade scores service

The leaderboard everybody shares. A single Node process with SQLite, no build
step and no native modules: `node:sqlite` ships with the runtime and Node runs
the TypeScript directly.

## API

| Method | Path           | Purpose                                     |
| ------ | -------------- | ------------------------------------------- |
| GET    | `/api/health`  | liveness, used by the container healthcheck |
| GET    | `/api/scores`  | the top 50, best first                      |
| POST   | `/api/scores`  | submit 1–4 players from one finished season |

```jsonc
// POST /api/scores
{ "entries": [ { "name": "ADA", "assets": 4635, "days": 12,
                 "glasses": 800, "seed": 1234, "broke": false } ] }
// 201 -> { "ids": ["17"], "scores": [ ...the new board... ] }
```

## What it does and does not guarantee

Everything in a request is treated as hostile. Names are forced to a printable
uppercase subset and cut to 12 characters. Every number must be an integer in
range, and a score is refused if it could not have happened: assets above
`$2.00 + $25 a day`, or glasses above 400 a day, are rejected as impossible for
the days claimed. Bodies are capped at 4 KB and submissions at 30 an hour per
address, which is why `TRUST_PROXY=1` matters behind nginx — otherwise every
request looks like it came from the proxy.

**It cannot prove a score is real.** There are no accounts and no signing, so
anyone willing to craft a request can post a plausible score under any name.
The checks stop nonsense and casual spam, not a determined forger. That is a
deliberate trade for a game with no sign-up; if the board ever needs to be
trustworthy it needs identities, which is a different piece of work.

Only the best 500 rows are kept; the rest are pruned on write.

## Running it

```bash
npm run scores          # from the repo root, on :5184
npm run dev:all         # game and scores service together
```

Environment: `PORT` (5184), `DB_PATH` (`./data/scores.db`), `TRUST_PROXY`
(`1` behind a proxy).

## Deploying

```bash
docker compose -f server/compose.yml up -d --build
```

The container is read-only apart from the named volume holding the database —
that volume is the one piece of state that must survive a redeploy. In front
of it, nginx terminates TLS and proxies `/api/` through:

```nginx
location /api/ {
    proxy_pass         http://127.0.0.1:5184;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

The game itself is a static bundle and needs no server; point it at another
origin with `VITE_SCORES_API=https://example.org/api` at build time, or serve
both from one origin and leave it on the default `/api`.
