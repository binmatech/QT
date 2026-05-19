import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { getArticleById } from "./src/services/articleService";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use custom to handle routes manually
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist'), { index: false }));
  }

  // API or special routes if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Handle article routes for meta tag injection
  app.get('/article/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
      let template: string;
      const indexHtmlPath = process.env.NODE_ENV !== "production" 
        ? path.resolve(process.cwd(), "index.html")
        : path.resolve(process.cwd(), "dist/index.html");

      template = fs.readFileSync(indexHtmlPath, "utf-8");

      if (process.env.NODE_ENV !== "production" && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }

      // Fetch article data
      const article = await getArticleById(id);

      if (article) {
        const title = `${article.title} | Quotient Africa`;
        const description = article.excerpt || "Read this article on Quotient Africa";
        const image = article.image || "/og-image.png";

        // Perform tag injection
        template = template
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/id="meta-description" content=".*?"/, `id="meta-description" content="${description}"`)
          .replace(/id="og-title" content=".*?"/, `id="og-title" content="${title}"`)
          .replace(/id="og-description" content=".*?"/, `id="og-description" content="${description}"`)
          .replace(/id="og-image" content=".*?"/, `id="og-image" content="${image}"`)
          .replace(/id="twitter-title" content=".*?"/, `id="twitter-title" content="${title}"`)
          .replace(/id="twitter-description" content=".*?"/, `id="twitter-description" content="${description}"`)
          .replace(/id="twitter-image" content=".*?"/, `id="twitter-image" content="${image}"`);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // All other routes serve index.html
  app.get('*', async (req, res, next) => {
    if (req.originalUrl.includes('.')) return next(); // Skip files

    try {
      let template: string;
      const indexHtmlPath = process.env.NODE_ENV !== "production" 
        ? path.resolve(process.cwd(), "index.html")
        : path.resolve(process.cwd(), "dist/index.html");

      template = fs.readFileSync(indexHtmlPath, "utf-8");

      if (process.env.NODE_ENV !== "production" && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
