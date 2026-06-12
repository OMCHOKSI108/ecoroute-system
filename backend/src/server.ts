import { createApp } from './app';
import { config } from './config/env';
import { pool } from './config/db';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(
    JSON.stringify({
      level: 'info',
      message: `${config.appName} started`,
      port: config.port,
      nodeEnv: config.nodeEnv,
      offlineMode: config.offline.offlineMode,
    }),
  );
});

function shutdown(signal: string): void {
  console.log(JSON.stringify({ level: 'info', message: `Received ${signal}, shutting down` }));
  server.close(() => {
    pool
      .end()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
