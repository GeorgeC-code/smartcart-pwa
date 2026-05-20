import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// Safe __dirname equivalent that handles both ESM (dev) and CommonJS (prod)
const _dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // 1.5 Early High-Priority serving of manifest and icons to prevent 404/HTML fallbacks
  const pwaAssetsUniversal: Record<string, string> = {
    'manifest.json': 'application/manifest+json',
    'icon-192.png': 'image/png',
    'icon-192-maskable.png': 'image/png',
    'icon-512.png': 'image/png',
    'icon-96.png': 'image/png',
    'icon-192.jpg': 'image/jpeg',
    'icon-512.jpg': 'image/jpeg',
    'screenshot.jpg': 'image/jpeg',
    'favicon.svg': 'image/svg+xml',
    'sw.js': 'application/javascript'
  };

  // Add highly useful diagnostic endpoint to verify actual production paths
  app.get("/debug-pwa", (req, res) => {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      _dirname: _dirname,
      node_env: process.env.NODE_ENV,
      files: {}
    };

    Object.keys(pwaAssetsUniversal).forEach((asset) => {
      const paths = [
        path.resolve(_dirname, asset),
        path.resolve(process.cwd(), 'dist', asset),
        path.resolve(process.cwd(), 'public', asset),
        path.resolve(_dirname, 'public', asset),
        path.resolve(_dirname, '..', 'public', asset)
      ];
      
      debugInfo.files[asset] = paths.map(p => ({
        path: p,
        exists: fs.existsSync(p)
      }));
    });

    res.json(debugInfo);
  });

  Object.entries(pwaAssetsUniversal).forEach(([asset, contentType]) => {
    app.get(`/${asset}`, (req, res, next) => {
      // In development, let Vite's dev server serve PWA assets (like virtual sw.js or public mainfest)
      if (process.env.NODE_ENV !== "production") {
        return next();
      }

      // Build a collection of prospective paths to find the asset
      const pathsToTry = [
        // 1. Same directory as the server file (extremely reliable for compiled/dist in prod)
        path.resolve(_dirname, asset),
        // 2. Relative to process current working directory
        path.resolve(process.cwd(), 'dist', asset),
        path.resolve(process.cwd(), 'public', asset),
        // 3. For development mode when running server.ts from root
        path.resolve(_dirname, 'public', asset),
        // 4. Parent level fallback (if running from dist/ directory)
        path.resolve(_dirname, '..', 'public', asset)
      ];

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

      let attemptIndex = 0;
      
      function tryNextPath() {
        if (attemptIndex >= pathsToTry.length) {
          console.error(`[PWA Asset Error] Universal Asset "${asset}" (${contentType}) NOT found in any of the attempted locations:`, pathsToTry);
          // Return a 404 with plain text instead of falling through to the index.html SPA HTML fallback
          res.setHeader('Content-Type', 'text/plain');
          res.status(404).send(`Not Found: ${asset}`);
          return;
        }

        const currentPath = pathsToTry[attemptIndex];
        res.sendFile(currentPath, (err) => {
          if (err) {
            // Path didn't exist or couldn't be sent, try the next candidate
            attemptIndex++;
            tryNextPath();
          } else {
            console.log(`[PWA Asset Success] Served "${asset}" from: ${currentPath} as ${contentType}`);
          }
        });
      }

      tryNextPath();
    });
  });

  // 2. Health check
  app.get("/health", (req, res) => {
    res.send("SmartCart Server is Running");
  });

  // 3. Setup paths based on environment
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    console.log("Starting in DEVELOPMENT mode");
    // Serve public folder in dev
    app.use(express.static(path.resolve(process.cwd(), "public"), { dotfiles: "allow" }));
    
    // Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode");
    // In Production, the bundle is in dist/server.cjs
    // We serve assets from the dist folder which contains both build output and public files
    const distPath = path.join(process.cwd(), "dist");
    
    console.log(`Serving static files from: ${distPath}`);
    
    // Serve dist folder assets (Vite copies public to dist)
    // We put this BEFORE any other routes to ensure assets are caught
    app.use(express.static(distPath, { 
      dotfiles: "allow",
      index: false // Don't serve index.html here, we handle it in the fallback
    }));

    // Privacy Policy Route (Required for Play Store)
    app.get("/privacy", (req, res) => {
      res.send(`
        <html>
          <head><title>Privacy Policy - SmartCart</title></head>
          <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6;">
            <h1>Privacy Policy</h1>
            <p>SmartCart built the SmartCart app as a Free app. This SERVICE is provided by SmartCart at no cost and is intended for use as is.</p>
            <p>This page is used to inform visitors regarding our policies with the collection, use, and disclosure of Personal Information if anyone decided to use our Service.</p>
            <p><strong>Information Collection and Use</strong></p>
            <p>All data entered into SmartCart is stored locally on your device. We do not collect, store, or share any personal data on our servers.</p>
            <p><strong>Security</strong></p>
            <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.</p>
          </body>
        </html>
      `);
    });

    // Handle SPA fallback
    app.get("*", (req, res, next) => {
      // If the request is for something that looks like a file (has an extension), 
      // but reached this point, it means express.static didn't find it.
      // We should NOT serve index.html for these as it breaks bots expecting binaries.
      const ext = path.extname(req.path);
      if (ext && ext !== '.html') {
        console.warn(`Asset not found and falling through: ${req.path}`);
        return res.status(404).send("Not Found");
      }

      // Only serve index.html for GET and HEAD requests
      if (req.method !== "GET" && req.method !== "HEAD") {
        return res.status(404).send("Not Found");
      }

      const indexPath = path.resolve(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          if (!res.headersSent) {
            res.status(500).send("Server Error: Application files are being updated, please try again in a moment.");
          }
        }
      });
    });
  }

  // 6. Error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
