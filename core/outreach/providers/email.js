/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  EMAIL PROVIDERS - Pluggable email sending                                   ║
 * ║  Supports: SMTP, SendGrid, Mailgun, Resend, SES                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { generateId } = require('../../utils');

// ═══════════════════════════════════════════════════════════════════════════
// BASE EMAIL PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class BaseEmailProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = 'base';
    this.config = config;
    this.sentCount = 0;
    this.errorCount = 0;
  }

  async send(prospect, message, options = {}) {
    throw new Error('send() must be implemented by subclass');
  }

  async sendBatch(emails) {
    const results = [];
    for (const email of emails) {
      try {
        const result = await this.send(email.prospect, email.message, email.options);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }

  getStats() {
    return {
      provider: this.name,
      sent: this.sentCount,
      errors: this.errorCount
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SMTP PROVIDER (Generic, works with any SMTP server)
// ═══════════════════════════════════════════════════════════════════════════

class SMTPProvider extends BaseEmailProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'smtp';

    // SMTP configuration
    this.host = config.host || process.env.SMTP_HOST;
    this.port = config.port || process.env.SMTP_PORT || 587;
    this.secure = config.secure || false;
    this.auth = {
      user: config.user || process.env.SMTP_USER,
      pass: config.pass || process.env.SMTP_PASS
    };
    this.from = config.from || process.env.SMTP_FROM;

    this.transporter = null;
  }

  async initialize() {
    try {
      // Dynamic import nodemailer
      const nodemailer = require('nodemailer');

      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: this.auth
      });

      // Verify connection
      await this.transporter.verify();
      console.log(`[EMAIL] SMTP connected to ${this.host}`);

      return true;
    } catch (error) {
      console.error('[EMAIL] SMTP connection failed:', error.message);
      return false;
    }
  }

  async send(prospect, message, options = {}) {
    if (!this.transporter) {
      await this.initialize();
    }

    const mailOptions = {
      from: options.from || this.from,
      to: prospect.email,
      subject: typeof message === 'object' ? message.subject : options.subject || 'Message',
      text: typeof message === 'object' ? message.body : message,
      html: options.html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.sentCount++;
      this.emit('sent', { messageId: info.messageId, to: prospect.email });
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error: error.message, to: prospect.email });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SENDGRID PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class SendGridProvider extends BaseEmailProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'sendgrid';

    this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY;
    this.from = config.from || process.env.SENDGRID_FROM;

    this.client = null;
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);
      this.client = sgMail;
      console.log('[EMAIL] SendGrid initialized');
      return true;
    } catch (error) {
      console.error('[EMAIL] SendGrid initialization failed:', error.message);
      return false;
    }
  }

  async send(prospect, message, options = {}) {
    if (!this.client) {
      await this.initialize();
    }

    const msg = {
      to: prospect.email,
      from: options.from || this.from,
      subject: typeof message === 'object' ? message.subject : options.subject || 'Message',
      text: typeof message === 'object' ? message.body : message,
      html: options.html
    };

    try {
      const [response] = await this.client.send(msg);
      this.sentCount++;
      this.emit('sent', { statusCode: response.statusCode, to: prospect.email });
      return { sent: true, statusCode: response.statusCode };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error: error.message, to: prospect.email });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESEND PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class ResendProvider extends BaseEmailProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'resend';

    this.apiKey = config.apiKey || process.env.RESEND_API_KEY;
    this.from = config.from || process.env.RESEND_FROM;

    this.client = null;
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error('Resend API key not configured');
    }

    try {
      const { Resend } = require('resend');
      this.client = new Resend(this.apiKey);
      console.log('[EMAIL] Resend initialized');
      return true;
    } catch (error) {
      console.error('[EMAIL] Resend initialization failed:', error.message);
      return false;
    }
  }

  async send(prospect, message, options = {}) {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const { data, error } = await this.client.emails.send({
        from: options.from || this.from,
        to: prospect.email,
        subject: typeof message === 'object' ? message.subject : options.subject || 'Message',
        text: typeof message === 'object' ? message.body : message,
        html: options.html
      });

      if (error) throw new Error(error.message);

      this.sentCount++;
      this.emit('sent', { id: data.id, to: prospect.email });
      return { sent: true, id: data.id };
    } catch (error) {
      this.errorCount++;
      this.emit('error', { error: error.message, to: prospect.email });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSOLE PROVIDER (For testing/development)
// ═══════════════════════════════════════════════════════════════════════════

class ConsoleEmailProvider extends BaseEmailProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'console';
    this.messages = [];
  }

  async send(prospect, message, options = {}) {
    const email = {
      id: generateId('email'),
      to: prospect.email,
      subject: typeof message === 'object' ? message.subject : options.subject || 'Message',
      body: typeof message === 'object' ? message.body : message,
      timestamp: Date.now()
    };

    this.messages.push(email);
    this.sentCount++;

    console.log('\n' + '═'.repeat(60));
    console.log(`📧 EMAIL TO: ${email.to}`);
    console.log(`📋 SUBJECT: ${email.subject}`);
    console.log('─'.repeat(60));
    console.log(email.body);
    console.log('═'.repeat(60) + '\n');

    this.emit('sent', { id: email.id, to: prospect.email });
    return { sent: true, id: email.id, logged: true };
  }

  getMessages() {
    return this.messages;
  }

  clearMessages() {
    this.messages = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER FACTORY
// ═══════════════════════════════════════════════════════════════════════════

function createEmailProvider(type, config = {}) {
  switch (type.toLowerCase()) {
    case 'smtp':
      return new SMTPProvider(config);
    case 'sendgrid':
      return new SendGridProvider(config);
    case 'resend':
      return new ResendProvider(config);
    case 'console':
    case 'test':
      return new ConsoleEmailProvider(config);
    default:
      throw new Error(`Unknown email provider type: ${type}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  BaseEmailProvider,
  SMTPProvider,
  SendGridProvider,
  ResendProvider,
  ConsoleEmailProvider,
  createEmailProvider
};
