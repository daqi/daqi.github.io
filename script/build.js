const path = require("path");

const Blog = require("./blog");
const pagesPath = path.join(__dirname, "../src");
const dailyPath = path.join(__dirname, "../src/daily");
const outputPath = path.join(__dirname, "../dist");

new Blog({
  title: "Daqi's blog",
  domain: "daqi.io",
  output: outputPath,
  router: [
    {
      path: "/",
      mdDir: pagesPath
    },
    {
      path: "/daily",
      mdDir: dailyPath
    }
  ]
});
