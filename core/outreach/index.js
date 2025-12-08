/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  OUTREACH MODULE - Complete sales/marketing automation                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const {
  OutreachEngine,
  Campaign,
  Prospect,
  CHANNELS,
  CAMPAIGN_TYPES,
  SEQUENCE_TEMPLATES,
  MESSAGE_TEMPLATES
} = require('./engine');

const {
  BaseEmailProvider,
  SMTPProvider,
  SendGridProvider,
  ResendProvider,
  ConsoleEmailProvider,
  createEmailProvider
} = require('./providers/email');

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Core Engine
  OutreachEngine,
  Campaign,
  Prospect,

  // Constants
  CHANNELS,
  CAMPAIGN_TYPES,
  SEQUENCE_TEMPLATES,
  MESSAGE_TEMPLATES,

  // Email Providers
  BaseEmailProvider,
  SMTPProvider,
  SendGridProvider,
  ResendProvider,
  ConsoleEmailProvider,
  createEmailProvider
};
