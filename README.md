# Backend (server.js) Documentation

This README covers the **Node.js + Express server** (`server.js`) that powers the Puppeteer-based scraping endpoint. It explains:

* Purpose and data source
* Installation and local setup
* Configuration and environment variables
* How the `/scrape` endpoint works
* Deployment instructions (e.g., on Render)

---

## 1. Overview

`server.js` implements a single HTTP endpoint:

```
POST /scrape
```

Clients (e.g., the React frontend) send JSON bodies containing:

```json
{ "url": "https://example.com/somepage" }
```

The server launches a headless Chrome instance via **Puppeteer**, navigates to the provided URL, waits for network activity to idle, then runs a page-level `document.querySelectorAll("article.product_pod")` to scrape data. Finally, it returns a JSON object with:

* `book_name`: the text in `.page-header h1` (if present)
* `books`: an array of objects, each with `{ title, price, stock, rating }`

CORS is enabled globally so that any origin (or a specific origin if configured) can send requests. The server also handles the preflight `OPTIONS` request for `/scrape`.

---

## 2. Data Source & Flow

1. **Client-side**: A React app calls:

   ```js
   fetch(`${BACKEND_URL}/scrape`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ url: "https://books.toscrape.com/" })
   })
   .then(res => res.json())
   .then(data => { /* render table */ });
   ```

2. **Server-side** (`server.js`):

   * Receives `{ url }` in the JSON body.
   * Launches Puppeteer:

     ```js
     const browser = await puppeteer.launch({
       headless: true,
       args: ["--no-sandbox", "--disable-setuid-sandbox"]
     });
     ```
   * Opens a new page and `goto(url, { waitUntil: "networkidle2" })`.
   * Uses `page.evaluate()` to scrape:

     ```js
     const books = Array.from(document.querySelectorAll("article.product_pod"));
     const headerEl = document.querySelector(".page-header h1");
     const book_name = headerEl ? headerEl.textContent.trim() : null;
     const booksData = books.map(book => ({
       title: book.querySelector("h3 a").getAttribute("title"),
       price: book.querySelector(".price_color").textContent.trim(),
       stock: book.querySelector(".instock.availability").textContent.trim(),
       rating: book.querySelector(".star-rating").classList[1]
     }));
     return { book_name, books: booksData };
     ```
   * Closes the browser and sends `res.json({ book_name, books })`.

3. **Client-side**: Receives scraped JSON and displays it in a table.

---

## 3. Installation & Local Setup

### Prerequisites

* **Node.js** (16 or higher) installed locally
* **npm** or **yarn** available in your PATH
* A terminal/command prompt

### Step-by-Step

1. **Clone the backend repository** (or navigate to the folder containing `server.js`):

   ```bash
   git clone https://github.com/YOUR_USERNAME/puppeteer-scraper.git
   cd puppeteer-scraper
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   This installs:

   * `express` (web framework)
   * `puppeteer` (headless browser)
   * `cors` (CORS middleware)

3. **(Optional) Create `.env`**

   * If you have any environment-specific variables (e.g., DEBUG flags), create a `.env` file. The basic `server.js` does not require any secrets.

4. **Run the server locally**:

   ```bash
   npm start
   ```

   By default, it listens on `port 2000`. You should see in the console:

   ```text
   Server running on port 2000
   ```

5. **Test the `/scrape` endpoint** (e.g., via Postman, curl, or browser fetch):

   ```bash
   curl -X POST http://localhost:2000/scrape \
     -H "Content-Type: application/json" \
     -d '{"url": "https://books.toscrape.com/"}'
   ```

   You should receive a JSON response:

   ```json
   {
     "book_name": "Books",
     "books": [
       { "title": "Book Title 1", "price": "£53.74", "stock": "In stock", "rating": "Three" },
       { "title": "Book Title 2", "price": "£45.17", "stock": "In stock", "rating": "One" },
       …
     ]
   }
   ```

---

## 4. Configuration & Environment Variables

* **Port**: `process.env.PORT` or `2000` by default.
* **CORS**: By default, `app.use(cors())` allows *all origins*. If you want to restrict to only your frontend’s domain (e.g., `https://internwebscraper.web.app`), replace:

  ```js
  app.use(cors());
  ```

  with:

  ```js
  app.use(cors({ origin: 'https://internwebscraper.web.app' }));
  ```
* **Puppeteer Launch Options**:

  * `headless: true` ensures the browser runs without UI.
  * `args: ["--no-sandbox", "--disable-setuid-sandbox"]` are required when running inside certain containerized environments (like Render or Docker).

No other environment variables are strictly required, unless you later need API keys or custom flags.

---

## 5. `/scrape` Endpoint Details

### Request

* **Method**: `POST`
* **URL**: `/scrape`
* **Headers**:

  * `Content-Type: application/json`
* **Body (JSON)**:

  ```json
  {
    "url": "<target_webpage_url>"
  }
  ```

  * `url` must be a fully qualified URL (with `http://` or `https://`).

### Response

* **On Success (200 OK)**:

  ```json
  {
    "book_name": "<Header text or null>",
    "books": [
      {
        "title": "<Book title>",
        "price": "<Price text>",
        "stock": "<Stock availability>",
        "rating": "<Rating class>"
      },
      …
    ]
  }
  ```

* **On Error (500 Internal Server Error)**:

  ```json
  {
    "error": "<Error message>"
  }
  ```

  Common errors include:

  * Invalid URL (Puppeteer cannot navigate)
  * Timeout (if page takes too long to load)
  * Puppeteer launch failures (missing dependencies in production)

### Preflight (`OPTIONS /scrape`)

* Responds with CORS headers (`Access-Control-Allow-Origin`, etc.)
* Does not require a request body.

---

## 6. Deployment (Render)

Render.com is a free hosting service that supports Node.js. To deploy this scraper:

### 6.1. Create a `render.yaml`

At the root of your repository, add:

```yaml
services:
  - type: web
    name: puppeteer-scraper
    env: node
    plan: free
    buildCommand: "npm install"
    startCommand: "node server.js"
    autoDeploy: true
```

* `name`: Service name on Render (e.g., `puppeteer-scraper`).
* `env: node`: Indicates a Node.js environment.
* `plan: free`: Uses Render’s free tier.
* `buildCommand`: How to install dependencies.
* `startCommand`: How to start the server.
* `autoDeploy: true`: Automatically deploy on each GitHub push.

### 6.2. Push to GitHub & Connect to Render

1. Commit and push your `server.js`, `package.json`, and `render.yaml` to a GitHub repo (public or private).
2. In Render’s dashboard, click **New → Web Service**.
3. Select your repo, and Render should auto-detect `render.yaml`.
4. Confirm settings and deploy. After a few minutes, Render will assign a URL, e.g.:

   ```
   https://puppeteer-scraper-os7q.onrender.com
   ```
5. Your React frontend’s `REACT_APP_BACKEND_URL` should point to this URL.

---

## 7. Common Troubleshooting

1. **Error: Failed to launch the browser**

   * Ensure `args: ["--no-sandbox", "--disable-setuid-sandbox"]` are included. Many container environments block sandboxing.
   * On local machines, you can omit these flags if not needed.

2. **CORS issues**

   * Confirm `app.use(cors())` is declared before any routes.
   * If restricting to a single origin, verify that `origin: 'https://internwebscraper.web.app'` matches exactly (including protocol).

3. **Timeouts**

   * By default, `page.goto(url, { waitUntil: "networkidle2" })` waits up to 30 seconds. If pages are slow, consider:

     ```js
     await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
     ```
   * Understand that increasing timeout may block other requests if your service is under load.

4. **Render build failures**

   * Check `render.yaml` indentation carefully (must be valid YAML).
   * View the Deploy logs in Render to see specific npm errors.

---

## 8. Dependencies (`package.json` Example)

```json
{
  "name": "puppeteer-scraper",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "puppeteer": "^21.3.8"
  },
  "engines": {
    "node": ">=16"
  }
}
```

* Ensure `puppeteer` is at a compatible version. Sometimes updating to the latest major can help avoid Chromium download issues.

---

## 9. Security Considerations

* **Unrestricted CORS** (`app.use(cors())`) allows any origin to call `/scrape`. If you only want your frontend to access it, use:

  ```js
  app.use(cors({ origin: 'https://internwebscraper.web.app' }));
  ```
* **User-submitted URLs**: Scraping arbitrary URLs can introduce risks:

  * Ensure you validate or sanitize the URL before calling `page.goto()`.
  * Consider whitelisting known domains or using a rate limit to prevent abuse.

---

## 10. License

This backend code is released under the [MIT License](https://opensource.org/licenses/MIT).

---

> *Built with Puppeteer & Express by [Your Name](https://github.com/YOUR_USERNAME)*
