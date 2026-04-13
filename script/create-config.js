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
    paths: {
      contentPath: path.join(__dirname, '..', 'content')
    }
  };

  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunSmtpLogin = process.env.MAILGUN_SMTP_LOGIN;
  const mailgunSmtpPassword = process.env.MAILGUN_SMTP_PASSWORD;

  if (mailgunApiKey && mailgunDomain) {
    config.mail = {
      transport: 'Mailgun',
      from: getEnv('MAIL_FROM', undefined),
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
      from: getEnv('MAIL_FROM', undefined),
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

  if (process.env.MAIL_FROM) {
    config.mail.from = process.env.MAIL_FROM;
  }

  if (process.env.CLOUDINARY_URL) {
    config.storage = {
      active: 'cloudinary',
      media: 'LocalMediaStorage',
      files: 'LocalFilesStorage',
      cloudinary: {
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
}

createConfig();
