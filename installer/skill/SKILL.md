---
name: yihetong-installer
description: Prepare, configure, install, verify, back up, or roll back a packaged Yihetong deployment by driving its existing yhtctl or yihetong-cli commands. Use for customer delivery or isolated installation work; stop before secrets, DNS/TLS, WeChat, payment, formal License issuance, production changes, or business UAT.
---

# Yihetong Installer

Use the installer package as the authority. Do not recreate deployment logic in the Skill, edit product code to carry customer differences, or infer current status from an older package receipt.

## Start

1. Resolve the extracted package root and run `./yhtctl manifest --package-root . --verify --json`.
2. Read `VERSION.json`, `docs/INSTALL.md`, `docs/PACKAGE_LAYOUT.md`, and `docs/CONFIGURATION_ORDER.md`.
3. Bind the intended environment, exact package hash, Profile path, secret-reference path, activation directory and rollback destination. Do not read or print secret values.
4. Use `./yhtctl` for the deterministic engine. `./yihetong-cli` is an optional operator/Agent adapter and must delegate to the same engine.

## Operate

- `prepare`: check first with `./yhtctl prepare --package-root . --json`. Installing OS packages is a root mutation; run the same command with `--yes` only after the target owner authorizes it.
- `configure`: use `./yhtctl config init --output <outside-package-dir>` with non-secret flags, an answers JSON, or `--interactive`. Never request secret values; hand the generated `secrets.refs.yaml` to the customer's protected provisioning process.
- `install`: validate, plan and review before `install --yes`. If activation files or a formal signed License/Lease are missing, stop and return the non-secret instance request to the authorized issuer.
- `verify`: run `status`, `verify` and the package-defined service/API/document-conversion checks. Report technical evidence separately from third-party or business acceptance.
- `rollback`: use only a receipt bound to the current install state and reviewed backup root. Show the target and receipt, then run `rollback ... --yes` only with rollback authorization.

Read [references/workflow.md](references/workflow.md) for exact command shapes, stop conditions and evidence requirements.

## Hard stops

Stop and return `user_final_required` or `blocked` at any of these boundaries:

- a credential, password, private key, certificate private material, token or secret value would need to be collected or displayed;
- DNS, public TLS, WeChat platform, payment merchant, SMS/provider, formal License issuance or production access is required;
- the package/Profile/target fingerprint drifts, a production placeholder remains, or an action would affect another deployment environment;
- a merge, push, release, destructive cleanup, database restore or rollback lacks exact authorization.

An install command, HTTP 200, service `active`, package hash or upload receipt proves only its own plane. Never label it customer UAT, third-party completion or the latest formal release without the corresponding acceptance.
