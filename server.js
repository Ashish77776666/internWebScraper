const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.post("/scrape", async (req, res) => {
    const url = req.body.url;
    try{
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(
      url,
      {
        waitUntil: "networkidle2",
      }
    );

    // const data = await page.evaluate(() => {
    //   const books = Array.from(
    //     document.querySelectorAll("article.product_pod")
    //   );
    //   const headerEl = document.querySelector(".page-header h1");
    //   const book_name=  headerEl ? headerEl.textContent.trim() : null;

    //   console.log(book_name, "hello"); // This will not log in your Node.js console — see notes below

    //   return books.map((book) => {
    //     const title = book.querySelector("h3 a").getAttribute("title");
    //     const price = book.querySelector(".price_color").textContent.trim();
    //     const stock = book
    //       .querySelector(".instock.availability")
    //       .textContent.trim();
    //     const rating = book.querySelector(".star-rating").classList[1]; // e.g., 'One', 'Two', etc.
    //     return { title, price, stock, rating };
    //   });
    // });

    const data = await page.evaluate(() => {
      const books = Array.from(
        document.querySelectorAll("article.product_pod")
      );
      const headerEl = document.querySelector(".page-header h1");
      const book_name = headerEl ? headerEl.textContent.trim() : null;

      const booksData = books.map((book) => {
        const title = book.querySelector("h3 a").getAttribute("title");
        const price = book.querySelector(".price_color").textContent.trim();
        const stock = book
          .querySelector(".instock.availability")
          .textContent.trim();
        const rating = book.querySelector(".star-rating").classList[1]; // e.g., 'One', 'Two', etc.
        return { title, price, stock, rating };
      });

      return { book_name, books: booksData };
    });

    await browser.close();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 2000;
app.listen(port, () => console.log(`Server running on port ${port}`));
