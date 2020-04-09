const path = require("path");
const util = require("util");
const marked = require("marked");
const fs = require("fs-extra");
const _ = require("lodash");
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const emptyDir = util.promisify(fs.emptyDir);
const ensureDir = util.promisify(fs.ensureDir);
const outputFile = util.promisify(fs.outputFile);

marked.setOptions({
  breaks: true,
  highlight(code, language) {
    const hljs = require("highlight.js");
    const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
    return hljs.highlight(validLanguage, code).value;
  },
});

/**
 * title domain router output
 */
class Blog {
  constructor(props) {
    this.props = props;
    this.cache = {};
    this.inject = {};
    this.outputs = [];
    this.build();
  }
  async build() {
    const { output, domain } = this.props;
    console.log("ensureDir", output);
    await ensureDir(output);
    console.log("emptyDir", output);
    await emptyDir(output);
    await this.renderMdToHtml();
    await this.injectHtml();
    console.log("bind domain", domain);
    await this.bindDomain();
  }
  async renderMdToHtml() {
    const { output, router, title } = this.props;
    const pArrs = router.map(async (route) => {
      const { path: pathname = "/", mdDir } = route;
      const files = await readdir(mdDir);
      const pArr = files.map(async (file) => {
        if (!/\.md$/.test(file)) return false;
        const outputFileName = file.replace(/\.md$/, ".html");
        const absPath = path.join(pathname, outputFileName);
        const outputFile = path.join(output, pathname, outputFileName);
        console.log("render", file, "to", outputFile);
        this.outputs.push(outputFile);
        const contentHTML = await this.md2Html(path.join(mdDir, file));
        const matchs = contentHTML.match(/<h1.*>(.*)<\/h1>/);
        const isHome = absPath === "/index.html";
        const curTitle = matchs && matchs[1] ? matchs[1] : null;
        const pageTitle =
          !isHome && curTitle ? `${curTitle} | ${title}` : title;
        await this.mdRender(pageTitle, contentHTML, outputFile);
        return {
          url: absPath,
          title: curTitle,
        };
      });
      this.inject[pathname] = await Promise.all(pArr);
      return route;
    });
    return await Promise.all(pArrs);
  }
  async bindDomain() {
    const { output, domain } = this.props;
    await outputFile(path.join(output, "CNAME"), domain);
  }
  async md2Html(pagePath) {
    const mdContent = await readFile(pagePath, "utf8");
    const htmlContent = marked(mdContent);
    return htmlContent;
  }
  async injectHtml() {
    const pArrs = this.outputs.map(async (output) => {
      const htmlContent = await readFile(output, "utf8");
      if (htmlContent.indexOf("{{{") < 0) return false;
      const res = htmlContent.replace(/{{{(.*?)}}}/g, (match, p1) => {
        const path = p1.split(/[\.\[\]]/).filter((el) => el);
        const context = { inject: this.inject };
        const data = _.get(context, path);
        if (Array.isArray(data)) {
          return `<ul>${data.reverse().reduce(
            (p, el) => `${p}<li><a href="${el.url}">${el.title}</a></li>`,
            ""
          )}</ul>`;
        }
        return _.get(context, path);
      });
      return await outputFile(output, res);
    });
    return await Promise.all(pArrs);
  }
  async style() {
    const { output } = this.props;
    if (this.cache.style) return this.cache.style;
    const mdCss = require.resolve("github-markdown-css/github-markdown.css");
    const hlCss = require.resolve("highlight.js/styles/github-gist.css");
    await fs.copy(mdCss, path.join(output, "css/md.css"));
    await fs.copy(hlCss, path.join(output, "css/hl.css"));
    this.cache.style = `<Link rel="stylesheet" href="/css/md.css" />
<Link rel="stylesheet" href="/css/hl.css" />`;
    return this.cache.style;
  }
  async mdRender(title, html, file) {
    const style = await this.style();
    const res = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${style}
<style>
#root { padding: 20px; } 
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
}

module.exports = Blog;
