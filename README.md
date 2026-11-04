<div align="center">
  <img src="assets/sagana_logo.png" alt="Sagana logo" width="150" />

# Sagana Mobile

Mobile application for Sagana composting machine operators

Machine management · Sensor monitoring · Batch workflows · Bluetooth provisioning

[Explore the docs](docs/index.md) · [Report a bug or request a feature](https://github.com/likha-innovations/sagana-mobile/issues) · [Contact](mailto:likhainnovations.tech@gmail.com)

[![Contributors](https://img.shields.io/github/contributors/likha-innovations/sagana-mobile)](https://github.com/likha-innovations/sagana-mobile/graphs/contributors) [![Forks](https://img.shields.io/github/forks/likha-innovations/sagana-mobile)](https://github.com/likha-innovations/sagana-mobile/forks) [![Stars](https://img.shields.io/github/stars/likha-innovations/sagana-mobile)](https://github.com/likha-innovations/sagana-mobile/stargazers) [![Issues](https://img.shields.io/github/issues/likha-innovations/sagana-mobile)](https://github.com/likha-innovations/sagana-mobile/issues)

</div>

## Contents
https://www.facebook.com/profile.php?id=61593904382435
- [About](#about)
- [Features](#features)
- [Built with](#built-with)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Sagana ecosystem](#sagana-ecosystem)
- [Contact](#contact)

## About

Sagana Mobile helps operators register and manage automated composting machines, view machine information, and follow composting workflows. It connects to the Sagana backend for account, machine, and feedstock data, and uses Bluetooth to provision machines.

Machine information is backed by the API. Batch creation is currently local to the app, and batch and sensor history use mock or empty data. Socket.IO handles live machine and telemetry events; hardware behavior requires a development build and a physical device for verification.

## Features

- **Accounts and profiles:** Sign in with Clerk, manage a profile, and select a barangay.
- **Machine management:** Register a machine, view machines assigned to your barangay, rename, update Wi-Fi settings, or remove a machine.
- **Bluetooth provisioning:** Connect to a machine and configure its Wi-Fi credentials.
- **Machine monitoring:** Show machine details, connectivity, and live sensor readings when telemetry is received.
- **Batch workflows:** Select feedstocks, enter weights, and create a local batch. Browse batch and history screens with search and date filters.
- **Dashboard:** View machines and summary information from available data.

See [feature status](docs/guide/ui-status.md) for current implementation details and limitations.

## Built with

[Expo](https://expo.dev/) · [React Native](https://reactnative.dev/) · [TypeScript](https://www.typescriptlang.org/) · [TanStack Query](https://tanstack.com/query) · [Zustand](https://zustand.docs.pmnd.rs/) · [Socket.IO](https://socket.io/)

## Getting started

### Prerequisites

- Node.js 24.13.0 and pnpm 12.11.2, matching mobile CI.
- Android Studio and an Android development build, or Xcode on macOS for iOS development.
- A physical supported device and development build for Bluetooth provisioning. Expo Go does not include the required native Bluetooth module.
- Access to a configured Sagana backend and Clerk application.

### Installation

```bash
git clone https://github.com/likha-innovations/sagana-mobile.git
cd sagana-mobile
pnpm install --frozen-lockfile
cp .env.example .env
```

Configure the Clerk publishable key and backend URL in your local environment file. See [environment variables](docs/reference/env-vars.md). For an Android development client, follow [team setup](docs/guide/team-setup.md).

```bash
pnpm exec expo start --dev-client
```

Open the development client and connect it to Metro. Native dependency or configuration changes may require rebuilding the client.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run start` | Start the Expo development server |
| `pnpm run android` | Build and run Android locally |
| `pnpm run ios` | Build and run iOS locally on macOS |
| `pnpm run typecheck` | Check TypeScript types |
| `pnpm test` | Run mobile Jest tests |
| `pnpm run lint` | Run ESLint with autofix |
| `pnpm run docs:dev` | Start the VitePress documentation server |
| `pnpm run docs:build` | Build the documentation |

For CI, dependency checks, and EAS development builds, see [team setup](docs/guide/team-setup.md).

## Sagana ecosystem

- **sagana-mobile:** Operator mobile application.
- **sagana-admin:** Administration application.
- **sagana-backend:** API, database, and device messaging services.
- **sagana-ai:** AI component.
- **sagana-firmware:** Machine firmware.

The backend repository is available at [sagana-backend](https://github.com/likha-innovations/sagana-backend).

## Contact

Likha Innovations · [Email](mailto:likhainnovations.tech@gmail.com) · [Facebook](https://www.facebook.com/profile.php?id=61593904382435)

## License

See [LICENSE](LICENSE).
