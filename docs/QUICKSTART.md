# Quick start

1. Clone the repository and verify `SHA256SUMS` before using the source snapshot.
2. For Mini Program/H5 development, install the root lockfile dependencies and use the uni-app toolchain. Supply your own HTTPS API endpoint and replace the example Mini AppID before a Mini Program build; never place an AppSecret in frontend source.
3. For the PC user frontend, run `npm ci` and `npm run build:prod` in `frontends/pc`.
4. For the website frontend, run `npm ci` and `npm run build` in `frontends/website`.
5. For installation tooling, run `npm ci` and `npm run check` in `installer/yhtctl`, then follow `installer/skill/SKILL.md` or download the verified package listed in `docs/INSTALLATION.md`.

Build success confirms only the local source/build path. Production deployment and business acceptance require environment-specific validation.
