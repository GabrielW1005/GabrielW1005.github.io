# Prepared short progress links — inactive

This directory is a reviewable implementation, **not a live service**. No Sites project has been created or deployed. The live GitHub Pages app does not import these modules. Existing compressed links and progress files continue to work.

A short link would look like `https://gabrielw1005.github.io/machine-lab/?v=s3#s=<22-character-id>` (73 characters). The release query ensures an older cached app loads the short-link-capable version. The snapshot is stored online; possession of the random ID grants read access. Saved progress can include a student's optional name and recent results, so students should share links only with intended recipients. Snapshots are immutable and have no automatic expiration.

## API

- `PUT /v1/progress/<id>` with `{ "token": "z2.…" }` creates one opaque compact snapshot. The browser generates 16 cryptographically random bytes and encodes them as a canonical 22-character base64url ID. A new record returns 201; an identical retry returns 200; a different token for that ID returns 409.
- `GET /v1/progress/<id>` returns `{ "token": "z2.…" }`, or 404. The app must still decode/validate progress and obtain the student's existing import confirmation before replacing local progress.
- Only current `c2.` / `z2.` wire tokens up to 12,000 characters are accepted. The service does not decode payloads, render content, redirect visitors, list records, overwrite, or delete snapshots. This is capability-based access, not student accounts.
- Anonymous visitors may create a new immutable capability record. They cannot modify an existing one. CORS is restricted to `https://gabrielw1005.github.io`; it is a browser boundary, not authentication or an abuse-proofing claim.

Schema triggers apply atomic caps: 500 new records per client IP per UTC day, 5,000 globally per day, and 100,000 lifetime records. School users behind the same public IP share the client cap. Retries of existing IDs consume no quota. At limits the app should offer a progress file or the existing self-contained link. The lifetime cap bounds growth without silently expiring students' links. A database administrator may explicitly remove a mistakenly shared snapshot; there is no public delete route and deletion does not refund quotas. Public IDs must remain unguessable; these are not six-digit classroom codes.

Only an HMAC-SHA-256 of Cloudflare's edge-provided client address is stored. No IP address is logged or stored. Creation fails closed without `request.cf`, `CF-Connecting-IP`, and a server-only `CLIENT_HASH_KEY` of at least 32 UTF-8 bytes. Do not add a browser secret, fall back to caller forwarding headers, or rotate the hash key during a quota day. No token, ID, student information, or exception details are logged by the Worker.

## Activation requires a decision

New Sites are private. This backend needs anonymous public access so students using the public GitHub app can create/open links without ChatGPT sign-in. **Do not change a Site's audience or activate this service without the user's explicit approval for that public progress-sharing backend.** Never put a private Site bypass token in the client. The site access change has not been requested or performed by this implementation.

After approval, create a separate backend Site, retain its returned project ID, and use its supported Worker+D1 deployment workflow. Bind D1 as `DB`; apply `migrations/0000_progress_shares.sql` as a schema migration; configure `CLIENT_HASH_KEY` through the runtime secret tool, never source or hosting.json. Build `worker.mjs` into the Worker's `dist/server/index.js` output. Preserve the public GitHub app and its URL.

Before enabling the client, verify that Sites forwards trusted Cloudflare `request.cf` and original `CF-Connecting-IP`, and that public CORS preflight, PUT and GET work from the GitHub origin. If the platform does not provide trustworthy original client addresses, keep this source inactive until a supported rate-limit identity is available. Verify deployment, wire in the constant service origin and client module, and retain long-link/file fallback. Do not accept arbitrary service origins from imported progress or URL input. Stored snapshots have no expiry; service availability still depends on its hosting and owner.

## Tests

Run `node --test source/short-links/test-*.mjs` from the app's `dist` directory with Node 24. The Worker tests execute the real schema/triggers using Node's SQLite implementation behind a small D1-shaped adapter. They cover simultaneous creates/retries/conflicts, atomic client/global/lifetime limits, quota rollback, immutable records, bounds, CORS, untrusted forwarding headers, and missing configuration. This does not substitute for deployment verification on hosted D1 or its edge identity propagation.
