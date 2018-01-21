# bazz

📬 effortless remote push notifications for the CLI

[![npm](https://img.shields.io/npm/v/bazz.svg)](https://www.npmjs.com/package/bazz)
[![npm](https://img.shields.io/npm/l/bazz.svg)](https://www.npmjs.com/package/bazz)
[![codecov](https://codecov.io/gh/lirantal/bazz/branch/master/graph/badge.svg)](https://codecov.io/gh/lirantal/bazz)
[![Build Status](https://travis-ci.org/lirantal/bazz.svg?branch=master)](https://travis-ci.org/lirantal/bazz)
[![Known Vulnerabilities](https://snyk.io/test/github/lirantal/bazz/badge.svg)](https://snyk.io/test/github/lirantal/bazz)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/lirantal/bazz.svg)](https://greenkeeper.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Installation

```bash
npm install -g bazz
```

# Usage

```
bazz sleep 3
```

# Architecture

The bazz CLI is accompanied by a [bazz-frontend](https://github.com/lirantal/bazz-frontend) frontend project for the user to sign-up to push notifications on his mobile / desktop, and a [bazz-serverless](https://github.com/lirantal/bazz-serverless) serverless functions project for the API service.

The complete high-level design, including sequence diagrams and deployment is available in [DESIGN.md](https://github.com/lirantal/bazz/blob/master/README.md) for review.

# Contributing

Please consult the [CONTIRBUTING](https://github.com/lirantal/bazz/blob/master/CONTRIBUTING.md) for guidelines on contributing to this project

## Author
Liran Tal <liran.tal@gmail.com>
