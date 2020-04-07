const path = require("path");

const Blog = require("./blog");

new Blog({
  title: "Daqi's blog",
  domain: "daqi.io",
  output: path.join(__dirname, "../dist"),
  router: [
    {
      path: "/",
      mdDir: path.join(__dirname, "../src"),
    },
    {
      path: "/daily",
      mdDir: path.join(__dirname, "../src/daily"),
    },
    {
      path: "/algorithm",
      mdDir: path.join(__dirname, "../src/algorithm"),
    },
  ],
});
