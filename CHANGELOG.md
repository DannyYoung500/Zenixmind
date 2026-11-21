# Changelog

## Unreleased

- Fixed the Library page runtime reference by importing the missing `Info` icon.
- Corrected generated-image persistence to use the resolved storage path consistently.
- Added a branded offline fallback page and a production-only service worker.
- Limited service-worker caching to the public offline page; API responses and private user data are excluded.
- Added regression coverage for the Library icon, image persistence, and offline service-worker behavior.
- Added repository setup, environment-variable, API, testing, security, and deployment documentation.
