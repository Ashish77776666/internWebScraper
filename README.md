# 🧠 Puppeteer Web Scraper – Backend

This is the backend server for scraping book data from a website using Puppeteer.

## 🚀 Features

- Accepts a `POST` request with a URL
- Uses Puppeteer to scrape data from the given page
- Returns book information as JSON

## 📦 Tech Stack

- Node.js
- Express.js
- Puppeteer
- CORS (for frontend integration)

## 📂 Files

- `server.js` – Main server file with scraping logic

## 🔄 API Endpoint

- `POST /scrape`
  - Request Body:
    ```json
    {
      "url": "https://books.toscrape.com/catalogue/category/books/travel_2/index.html"
    }
    ```
  - Response:
    ```json
    {
      "book_name": "Travel",
      "books": [
        {
          "title": "Book Title",
          "price": "£51.77",
          "stock": "In stock",
          "rating": "Three"
        },
        ...
      ]
    }
    ```

## 🛠️ Run Locally

```bash
git clone https://github.com/your-username/your-backend-repo.git
cd your-backend-repo
npm install
node server.js
