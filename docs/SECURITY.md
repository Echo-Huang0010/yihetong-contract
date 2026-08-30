# Security

Do not commit secrets, certificates, customer data, production configuration, database dumps or private filesystem paths. Repository examples use reserved or synthetic values and must be replaced for each deployment.

Keep AppSecret, AccessKey, database and Redis passwords, payment keys, certificates, private keys and commercial-license identity material in protected secret providers. Mini/H5, PC and website builds must contain only public endpoints and non-secret identifiers.

If you discover a vulnerability or suspected exposure, use a private security-reporting channel provided by the repository host or contact the repository owner privately before public disclosure. Do not include live credentials or customer records in an issue.
