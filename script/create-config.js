#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({path: envPath});
}

const configPath = path.join(__dirname, '..', 'config.production.json');

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
};

const getMailFrom = ({smtpUser, mailgunSmtpLogin, mailgunDomain}) => {
  if (process.env.MAIL_FROM) {
    return process.env.MAIL_FROM;
  }

  if (smtpUser) {
    return smtpUser;
  }

  if (mailgunSmtpLogin) {
    return mailgunSmtpLogin;
  }

  if (mailgunDomain) {
    return `noreply@${mailgunDomain}`;
  }

  return undefined;
};

function buildConfig() {
  const config = {
    url: getEnv('PUBLIC_URL', 'http://localhost:2368'),
    server: {
      host: '0.0.0.0',
      port: Number(getEnv('PORT', '2368'))
    },
    database: {
      client: 'mysql',
      connection: {
        host: getEnv('DB_HOST', '127.0.0.1'),
        port: Number(getEnv('DB_PORT', '3306')),
        user: getEnv('DB_USER', 'root'),
        password: getEnv('DB_PASSWORD', ''),
        database: getEnv('DB_NAME', 'ghost')
      }
    },
    logging: {
      level: getEnv('LOG_LEVEL', 'info'),
      transports: ['file', 'stdout']
    },
    security: {
      staffDeviceVerification: false
    },
    paths: {
      contentPath: path.join(__dirname, '..', 'content')
    }
  };

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunSmtpLogin = process.env.MAILGUN_SMTP_LOGIN;
  const mailgunSmtpPassword = process.env.MAILGUN_SMTP_PASSWORD;
  const mailFrom = getMailFrom({smtpUser, mailgunSmtpLogin, mailgunDomain});

  if (smtpHost === 'smtp.resend.com' && smtpPass) {
    // Resend: use HTTP API directly — GCP/Railway blocks outbound SMTP
    config.mail = {
      transport: 'Resend',
      from: mailFrom,
      options: {
        apiKey: smtpPass
      }
    };
  } else if (smtpHost && smtpUser && smtpPass) {
    // Generic SMTP — works with SendGrid, Postmark, etc.
    const smtpPort = Number(getEnv('SMTP_PORT', '587'));
    config.mail = {
      transport: 'SMTP',
      from: mailFrom,
      options: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        requireTLS: smtpPort !== 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      }
    };
  } else if (mailgunApiKey && mailgunDomain) {
    config.mail = {
      transport: 'Mailgun',
      from: mailFrom,
      options: {
        auth: {
          api_key: mailgunApiKey,
          domain: mailgunDomain
        }
      }
    };
  } else if (mailgunSmtpLogin && mailgunSmtpPassword) {
    config.mail = {
      transport: 'SMTP',
      from: mailFrom,
      options: {
        host: getEnv('MAILGUN_SMTP_HOST', 'smtp.mailgun.org'),
        port: Number(getEnv('MAILGUN_SMTP_PORT', '2525')),
        secure: false,
        requireTLS: true,
        auth: {
          user: mailgunSmtpLogin,
          pass: mailgunSmtpPassword
        },
        tls: {
          rejectUnauthorized: true
        }
      }
    };
  } else {
    config.mail = {
      transport: 'Direct'
    };
  }

  if (process.env.CLOUDINARY_URL) {
    config.storage = {
      active: 'LocalImagesStorage',
      images: 'cloudinary-storage',
      media: 'LocalMediaStorage',
      files: 'LocalFilesStorage',
      'cloudinary-storage': {
        useDatedFolder: false,
        upload: {
          use_filename: true,
          unique_filename: false,
          overwrite: false,
          folder: getEnv('CLOUDINARY_FOLDER', 'ghost-blog-images'),
          tags: ['blog']
        },
        fetch: {
          quality: 'auto',
          secure: true,
          cdn_subdomain: true
        }
      },
      LocalMediaStorage: {},
      LocalFilesStorage: {}
    };
  }

  return config;
}

function createConfig() {
  const config = buildConfig();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Wrote ${configPath}`);
  console.log(`Mail config: transport=${config.mail.transport} from=${config.mail.from}`);
}

createConfig();
