# FAQ

## What source code is included?

The repository includes the sanitized Mini Program/H5 source, the PC user frontend, the official website frontend, and the installer CLI and Skill. Backend, management-console, commercial-control, OpenPlatform and Yilink source code are not included.

## Where is the website source?

The public website application is in `frontends/website`. Its runtime endpoints and public links are supplied through deployment configuration; credentials and production environment files are not part of the repository.

## Does the installer package contain production configuration?

No. The downloadable community package contains runnable components, installer tooling and schema/upgrade resources, but no customer credentials or production Profile. Generate configuration for your own environment and provide secrets through protected references.

## Is a successful installation production acceptance?

No. The published validation establishes the recorded technical installation chain. Security review, third-party account setup, certificates, domain registration, backups and business acceptance remain the operator's responsibility.
