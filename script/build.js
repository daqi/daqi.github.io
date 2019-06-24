const path = require("path");
const util = require("util");
const marked = require("marked");
const fs = require("fs-extra");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const emptyDir = util.promisify(fs.emptyDir);
const ensureDir = util.promisify(fs.ensureDir);
const outputFile = util.promisify(fs.outputFile);

const pagesPath = path.join(__dirname, "../pages");
const outputPath = path.join(__dirname, "../dist");
const title = "Daqi's blog";

const cache = {};

async function getCss() {
  if (cache.css) return cache.css;
  const css = await readFile(
    require.resolve("github-markdown-css/github-markdown.css"),
    "utf8"
  );
  cache.css = css;
  return cache.css;
}

async function render(html, file) {
  const css = await getCss();
  const res = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
  <style>
#root {
  padding: 20px;
}
  </style>
  <style>
  ${css}
  </style>
</head>
<body>
<div id="root">
  <div class="markdown-body">
  ${html}
  </div>
</div>
</body>
</html>`;
  return await outputFile(file, res);
}

async function md2Html(pagePath) {
  const mdContent = await readFile(path.join(pagesPath, pagePath), "utf8");
  const htmlContent = marked(mdContent);
  return htmlContent;
}

async function renderMdToHtml() {
  const files = await readdir(pagesPath);
  const PromiseArr = [];
  files.forEach(async file => {
    if (/\.md$/.test(file)) {
      const output = path.join(outputPath, file.replace(/\.md$/, ".html"));
      console.log("render", file, 'to', output);
      const html = await md2Html(file);
      const resPromise = render(html, output);
      PromiseArr.push(resPromise);
    }
  });
  await Promise.all(PromiseArr);
}

async function build() {
  console.log("ensureDir", outputPath);
  await ensureDir(outputPath);
  console.log("emptyDir", outputPath);
  await emptyDir(outputPath);
  await renderMdToHtml();
}

build();
