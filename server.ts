import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Create Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

  // Enable high-limit body parser for base64 uploads (APKs)
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // Serve static .apk files directly with correct MIME types
  app.get("/:filename.apk", (req, res, next) => {
    const filename = req.params.filename + ".apk";
    const pathsToTry = [
      path.resolve(process.cwd(), 'dist', filename),
      path.resolve(process.cwd(), 'public', filename),
      path.resolve(_dirname, filename),
    ];
    
    let found = false;
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        // Let it serve inline so web crawlers and APK scrapers can download it programmatically with ease
        res.sendFile(p);
        found = true;
        break;
      }
    }
    if (!found) {
      next();
    }
  });

  // API to handle APK file uploads
  app.post("/api/upload-apk", (req, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64 || !filename) {
        return res.status(400).json({ error: "Missing base64 or filename data" });
      }

      if (!filename.endsWith(".apk")) {
        return res.status(400).json({ error: "Only .apk files are allowed" });
      }

      const cleanFilename = path.basename(filename);
      const base64Data = base64.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Write to public/
      const publicPath = path.resolve(process.cwd(), "public");
      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
      }
      fs.writeFileSync(path.join(publicPath, cleanFilename), buffer);
      console.log(`Successfully saved APK to public directory: ${path.join(publicPath, cleanFilename)}`);

      // Write to dist/ immediately to avoid any sync lag in production containers
      const distPath = path.resolve(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        fs.writeFileSync(path.join(distPath, cleanFilename), buffer);
        console.log(`Successfully saved APK to dist directory: ${path.join(distPath, cleanFilename)}`);
      }

      return res.json({ 
        success: true, 
        message: "APK file uploaded successfully!",
        filename: cleanFilename,
        url: `/${cleanFilename}`
      });
    } catch (err: any) {
      console.error("APK upload error:", err);
      return res.status(500).json({ error: err.message || "Failed to save APK file" });
    }
  });

  // API to list uploaded APK files
  app.get("/api/uploaded-apks", (req, res) => {
    try {
      const apks: string[] = [];
      const searchDirs = [
        path.resolve(process.cwd(), "public"),
        path.resolve(process.cwd(), "dist")
      ];
      searchDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          files.forEach(f => {
            if (f.endsWith(".apk") && !apks.includes(f)) {
              apks.push(f);
            }
          });
        }
      });
      return res.json({ apks });
    } catch (err) {
      return res.status(500).json({ error: "Failed to list APKs" });
    }
  });

  // API chat helper endpoint with Gemini
  app.post("/api/helper/chat", async (req, res) => {
    try {
      const { message, country, holiday, history } = req.body;
      
      const systemInstruction = `You are a helpful, smart, and friendly AI Assistant called "Expat Holiday Companion".
Your user is an international tourist, traveler, or expat who recently moved to or is traveling in a foreign country (especially Serbia, Hungary, Spain, or Germany).
Your goal is to answer queries in English with precise, practical details about national holidays, business/shop shutdowns, grocery store closure status, public transits, local traditions, and essential expat/tourist survival tips.
Always reply in English. When providing congratulatory phrases or expressions in the target language (Serbian, Magyar, Spanish, German, etc.), format them clearly with:
1. The exact phrasing in the native language (e.g. "Srećna Nova godina!")
2. The phonetic pronunciation (e.g. "Sréch-na Nó-va gó-di-na!")
3. The English translation (e.g. "Happy New Year!")
Keep your answers highly readable, structured, and action-oriented. Suggest pre-holiday checklists (such as picking up extra milk/bread, pulling cash from ATMs, and checking post hours) before a shutdown occurs. Always maintain a warm, welcoming, and reassuring expert persona.`;

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.role,
            parts: [{ text: h.text }]
          });
        }
      }
      
      const contextPrompt = `Context: Selected Country: ${country || "Not specified"}. ${holiday ? `Associated Holiday: ${holiday}.` : ""}
User query: ${message}`;
      
      contents.push({
        role: "user",
        parts: [{ text: contextPrompt }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in helper chat:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Expat Gemini assistant." });
    }
  });

  // 2. Health check
  app.get("/health", (req, res) => {
    res.send("Expat Holiday Helper Server is Running");
  });

  // Privacy Policy Route (Required for Play Store / Aptoide Verification)
  app.get("/privacy", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - SmartCart: Budget Grocery List</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1A1513;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 24px;
            background-color: #FAF8F5;
        }
        h1, h2, h3 {
            color: #1A1513;
            font-weight: 800;
        }
        h1 {
            border-bottom: 2px solid #E6DEC9;
            padding-bottom: 12px;
            margin-bottom: 30px;
            font-size: 28px;
        }
        h2 {
            font-size: 20px;
            margin-top: 28px;
            border-bottom: 1px solid #E6DEC9/40;
            padding-bottom: 6px;
        }
        p, li {
            font-size: 15px;
            color: #4A4543;
        }
        ul {
            padding-left: 20px;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 24px;
            border: 1px solid #E6DEC9;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #A19885;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy for SmartCart: Budget Grocery List</h1>
        <p><em>Last updated: June 13, 2026</em></p>
        
        <p>SmartCart built the <strong>SmartCart: Budget Grocery List</strong> app as a Free app. This SERVICE is provided at no cost and is intended for use as is.</p>
        
        <h2>1. Information Collection and Use</h2>
        <p>All data entered into <strong>SmartCart: Budget Grocery List</strong>, including grocery lists, items, and calculated prices, is stored <strong>locally on your mobile device</strong> using secure local browser database structures (LocalStorage/IndexedDB).</p>
        <p><strong>We do NOT collect, transmit, store, or share any personal data, location data, or list contents on our servers.</strong> Every detail is entered manually by the user, and your grocery data never leaves your device unless you explicitly express intent to export it (e.g., exporting lists as CSV files).</p>

        <h2>2. Device Permissions</h2>
        <p>This application does not request, require, or access any sensitive device permissions (such as camera, microphone, contacts, location, or photo library). All application workflows operate perfectly without any external permissions.</p>

        <h2>3. Third-Party Services</h2>
        <p>The application is designed to be fully self-contained. It does not integrate tracking analytics, SDK advertising networks, or other personal tracking systems that gather data about user interactions.</p>

        <h2>4. Contact Us</h2>
        <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <strong>iseerhinoceros@gmail.com</strong>.</p>
    </div>
    <footer>
        &copy; 2026 SmartCart. All rights reserved.
    </footer>
</body>
</html>
    `);
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
