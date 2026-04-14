# Caddy Service

This service sits in front of Ghost and proxies all traffic to the Ghost app over Railway private networking.

Required environment variables:

- `GHOST_UPSTREAM=http://ghost.railway.internal:2368`

Later, this Caddy service can also proxy `/.ghost/activitypub/*` and related Social Web routes to an ActivityPub service.
