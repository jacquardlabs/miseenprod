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

const getMailFrom = ({smtpUser}) => process.env.MAIL_FROM || smtpUser || undefined;

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
      transports: ['stdout']
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
  const mailFrom = getMailFrom({smtpUser});

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
