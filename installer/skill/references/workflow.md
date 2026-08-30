# Yihetong Installer Workflow

## Inputs

- extracted generic installer root and its external SHA-256;
- generated customer workspace outside the installer root;
- `customer-profile.yaml` containing non-secret facts only;
- `secrets.refs.yaml` containing references/providers only;
- a protected activation directory on the target;
- target-owner authorization for OS package changes and product install;
- rollback owner and destination.

Never accept secrets in an answers file, prompt transcript, task log, Profile, Markdown receipt or Agent output.

## Prepare

```bash
./yhtctl manifest --package-root . --verify --json
./yhtctl prepare --package-root . --json
# After target-owner authorization for root package installation:
./yhtctl prepare --package-root . --yes --json
```

The packaged ops script supports Ubuntu 22.04/24.04 through apt and the supported RPM family through the fixed, SHA-256-verified LibreOffice RPM bundle. Both branches install Noto CJK fonts and recheck `soffice` plus a real font file; Enterprise Linux enables the matching EPEL release automatically only when its base repositories lack the CJK package.

## Create a non-secret customer workspace

Command-mode example:

```bash
./yhtctl config init \
  --output /srv/yihetong-customer-config \
  --customer-code acme-prod \
  --project-name 'Acme Sign' \
  --company-name 'Acme Example Company' \
  --base-domain example.com \
  --owner acme-ops
```

For repeatable Agent use, pass `--answers /secure/non-secret-answers.json`. For human Q&A, use `--interactive`; the questions are non-secret. Production mode requires explicit target, storage and control-plane facts. The command refuses an existing output or a destination inside source/installer roots.

Expected outputs:

- `customer-profile.yaml` - non-secret baseline;
- `secrets.refs.yaml` - protected provider references, no values;
- `assets/` - approved brand-material staging;
- `external-actions/THIRD_PARTY_ACTIONS.md` - DNS/TLS/WeChat/payment/provider owner gates;
- `CONFIGURATION_ORDER.md` - protected secrets -> customer baseline -> deploy DB -> brand DB -> rebuild inputs -> third-party actions;
- `CONFIG_WORKSPACE.json` - file hashes and `secretValuesCollected=false`.

## Validate, plan and activate

```bash
./yhtctl config validate --profile customer-profile.yaml --secrets secrets.refs.yaml --json
./yhtctl config plan --profile customer-profile.yaml --secrets secrets.refs.yaml --json
./yhtctl instance create --activation-dir /root/yihetong-activation --instance-id <commercialAuthorization.instanceId-from-profile>
./yhtctl instance request --profile customer-profile.yaml --secrets secrets.refs.yaml --package-root . --activation-dir /root/yihetong-activation --out instance-request.json
```

At this point stop. The authorized issuer, not the Agent, performs formal License/Lease issuance. Resume only after signed material is returned through the approved protected channel and package/Profile/instance fingerprints match.

## Install and verify

```bash
./yhtctl install --profile customer-profile.yaml --secrets secrets.refs.yaml --package-root . --activation-dir /root/yihetong-activation --yes
./yhtctl status --profile customer-profile.yaml --secrets secrets.refs.yaml --json
./yhtctl verify --profile customer-profile.yaml --secrets secrets.refs.yaml --json
./yhtctl backup --profile customer-profile.yaml --secrets secrets.refs.yaml --reason post-install --json
```

Repeat install with the same exact version/Profile only to prove convergence; do not use it to overwrite customer data. Configuration changes use the controlled update path with a pre-change backup.

Verify separately: document conversion, systemd state, loopback services, public/API boundary, configuration readback and backup restoreability. Keep DNS/TLS, WeChat, payment, signing, real-name, SMS and business UAT pending until their owners provide evidence.

## Rollback

```bash
./yhtctl rollback --profile customer-profile.yaml --secrets secrets.refs.yaml --receipt /var/backups/yihetong/<receipt>.json --yes
./yhtctl verify --profile customer-profile.yaml --secrets secrets.refs.yaml --json
```

Before `--yes`, verify the receipt is inside the allowed backup root and bound to the current state/Profile/version/Manifests. Database restore or destructive rollback requires separate exact authorization. Preserve the pre-rollback safety backup and report post-rollback readback.

## Evidence return

Return package/source hashes, Profile fingerprint, target/runtime fingerprint, commands and exit codes, service/API/document results, backup/rollback receipts, unresolved external actions, rollback path and one of `complete`, `partial`, `revision_required`, or `blocked`. A technical installation should normally remain `partial` until customer and third-party acceptance is complete.
