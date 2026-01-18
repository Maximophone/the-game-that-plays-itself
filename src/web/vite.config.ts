import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to serve /api/replays listing from public/replays directory
function replayApiPlugin(): Plugin {
  return {
    name: 'replay-api',
    configureServer(server) {
      server.middlewares.use('/api/replays', (req, res, next) => {
        // Handle listing endpoint: GET /api/replays
        if (req.url === '/' || req.url === '') {
          const replaysDir = path.join(__dirname, 'public', 'replays');

          if (!fs.existsSync(replaysDir)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
            return;
          }

          try {
            const files = fs.readdirSync(replaysDir).filter(f => f.endsWith('.json'));
            const replays = files.map(fileName => {
              const filePath = path.join(replaysDir, fileName);
              const content = fs.readFileSync(filePath, 'utf-8');
              const data = JSON.parse(content);
              return {
                filePath: `replays/${fileName}`,
                fileName,
                metadata: data.metadata || {
                  engineVersion: data.engineVersion,
                  createdAt: data.createdAt,
                  config: data.config,
                  finalTurn: data.turns?.length || 0,
                  status: 'unknown'
                }
              };
            }).sort((a, b) =>
              new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
            );

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(replays));
          } catch (error) {
            console.error('[Vite Plugin] Failed to list replays:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to list replays' }));
          }
          return;
        }

        // Handle individual replay: GET /api/replays/:filename
        const filename = req.url?.replace(/^\//, '');
        if (filename) {
          const filePath = path.join(__dirname, 'public', 'replays', filename);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
            return;
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Replay not found' }));
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), replayApiPlugin()],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      }
    }
  }
})
