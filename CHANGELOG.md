# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added
- Initial release of MsGine SDK
- SMS sending functionality with correct API response structure:
  - `id` - Message ID
  - `sid` - Secondary ID (nullable)
  - `channel` - Communication channel (sms)
  - `to` - Array of recipient phone numbers
  - `from` - Sender name
  - `content` - Message content
  - `status` - Message status (pending, sent, delivered, failed)
  - `cost` - Message cost
  - `currency` - Cost currency
  - `createdAt` - Timestamp
- Batch SMS sending
- Comprehensive type definitions with TypeScript
- Automatic retry logic with exponential backoff
- Runtime validation using Zod
- Custom error classes (MsGineError, MsGineValidationError)
- Configurable timeout and retry settings
- Support for custom fetch implementations
- Comprehensive test coverage
- Full documentation and examples

### Features
- ✅ Type-safe API with full TypeScript support
- ✅ Automatic retries with configurable backoff
- ✅ Input validation with helpful error messages
- ✅ Modern ES modules and CommonJS support
- ✅ Minimal dependencies (only Zod for validation)

[1.0.0]: https://github.com/kasimlyee/msgine-sdk/releases/tag/v1.0.0