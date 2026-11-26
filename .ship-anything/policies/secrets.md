# Secrets policy

- Never write secrets into: source, docs, `.ship-anything/**`, memory files, reports, logs,
  screenshots, commit messages, issue/PR text, or prompts to external services.
- Reference secrets by **name** only (`STRIPE_SECRET_KEY`), with where they live
  (e.g. "Vercel env, production") — never their values.
- `.env*` files are gitignored; commit `.env.example` with empty values and comments.
- If a secret is discovered in the repo or history: stop, tell the user, recommend rotation;
  do not rewrite history without authorization.
- Redact secret-looking values (`sk_live_…`, `ghp_…`, `AKIA…`, PEM blocks, JWTs) from any
  tool output you quote.
