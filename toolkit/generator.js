"use strict";

console.time("generate time");
process.on("exit", () => console.timeEnd("generate time"));
// setTimeout(() => process.exit(), 900);

const path = require("path");
const fs = require("fs");
const marked = require("marked");

const fsex = (() => {
  const r2a = (relativePath) =>
    path.isAbsolute(relativePath)
      ? relativePath
      : path.join(__dirname, "..", relativePath);
  const makeDir = (dirPath, madeDirPath) => {
    try {
      fs.mkdirSync(dirPath);
      madeDirPath = madeDirPath || dirPath;
    } catch (error) {
      if (error.code === "ENOENT") {
        madeDirPath = makeDir(path.dirname(dirPath), madeDirPath);
        makeDir(dirPath, madeDirPath);
      } else if (!fs.statSync(dirPath).isDirectory()) {
        throw error;
      }
    }
    return madeDirPath;
  };
  const removeDir = (dirPath) => {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((item) => {
        const itemPath = path.join(dirPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          removeDir(itemPath);
        } else {
          fs.unlinkSync(itemPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  };
  const readFile = (filePath) => fs.readFileSync(filePath).toString();
  const readDir = (dirPath) =>
    fs.readdirSync(dirPath).map((item) => path.join(dirPath, item));
  const writeFile = (filePath, data) => {
    makeDir(path.parse(filePath).dir);
    fs.writeFileSync(filePath, data);
  };
  const copyFile = (sourceFilePath, targetFilePath) => {
    makeDir(path.parse(targetFilePath).dir);
    fs.copyFileSync(sourceFilePath, targetFilePath);
  };
  const copyDir = (sourceDirPath, targetDirPath) => {
    if (!fs.existsSync(targetDirPath)) {
      makeDir(targetDirPath);
    }
    fs.readdirSync(sourceDirPath).forEach((item) => {
      const sourceItemPath = path.join(sourceDirPath, item);
      const targetItemPath = path.join(targetDirPath, item);
      if (fs.statSync(sourceItemPath).isDirectory()) {
        copyDir(sourceItemPath, targetItemPath);
      } else {
        fs.copyFileSync(sourceItemPath, targetItemPath);
      }
    });
  };
  return {
    makeDir(dirPath) {
      makeDir(r2a(dirPath));
    },
    removeDir(dirPath) {
      removeDir(r2a(dirPath));
    },
    readFile(filePath) {
      return readFile(r2a(filePath));
    },
    readDir(dirPath) {
      return readDir(r2a(dirPath));
    },
    writeFile(filePath, data) {
      writeFile(r2a(filePath), data);
    },
    copyFile(sourceFilePath, targetFilePath) {
      copyFile(r2a(sourceFilePath), r2a(targetFilePath));
    },
    copyDir(sourceDirPath, targetDirPath) {
      copyDir(r2a(sourceDirPath), r2a(targetDirPath));
    },
    joinPath: path.join,
  };
})();

const minifier = (() => {
  if (process.argv.includes("--debug")) {
    return {
      html: (s) => s,
      htmlMd: (s) => s,
      css: (s) => s,
      js: (s) => s,
    };
  } else {
    const htmlMinifier = require("html-minifier-terser");
    const CleanCss = require("clean-css");
    const terser = require("terser");
    return {
      html: (s) =>
        htmlMinifier.minify(s, {
          collapseInlineTagWhitespace: true,
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          continueOnParseError: true,
          removeAttributeQuotes: true,
          removeComments: true,
          sortAttributes: true,
          sortClassName: true,
          minifyURLs: true,
        }),
      htmlMd: (s) =>
        htmlMinifier.minify(s, {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          continueOnParseError: true,
          removeAttributeQuotes: true,
          removeComments: true,
          sortAttributes: true,
          sortClassName: true,
          minifyURLs: true,
        }),
      css: (s) => new CleanCss({ level: 2 }).minify(s).styles,
      js: (s) =>
        terser
          .minify(s.replace(/const\s/g, "let "), {
            compress: {
              booleans_as_integers: true,
              passes: 3,
              unsafe: true,
              unsafe_arrows: true,
              unsafe_comps: true,
              unsafe_Function: true,
              unsafe_math: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true,
            },
          })
          .code.replace(/"use strict";/g, "")
          .replace(/;$/, ""),
    };
  }
})();

const parseMdFile = (filePath) => {
  const str = fsex.readFile(filePath);
  const readMeta = (key) => {
    const matched = str.match(`\n${key}: ([^\n]*)`);
    return matched ? matched[1] : null;
  };
  const mdStr = str.slice(str.indexOf("\n```") + 4);
  const content = `# ${readMeta("title")}\n\n${mdStr}\n`;
  return { readMeta, content };
};

const makePage = (() => {
  const template = minifier.html(fsex.readFile("./units/page.html"));
  return ({
    realPath = "",
    path = "",
    title = "",
    description = "",
    content = "",
    type, // "html" | "markdown"
  }) => {
    switch (type) {
      case "html":
        content = minifier.html(content);
        break;
      case "markdown":
        content = `<article class="card">${marked(content)}</article>`;
        content = minifier.htmlMd(content);
        break;
      default:
        throw "page type is not defined";
    }
    const result = template
      .replace(/{{ title }}/g, title)
      .replace(/{{ description }}/g, description)
      .replace(/{{ content }}/g, content);
    const targetPath = realPath
      ? fsex.joinPath("./public", realPath)
      : fsex.joinPath("./public", path, "/index.html");
    fsex.writeFile(targetPath, result);
  };
})();

// Initialization
{
  fsex.removeDir("./public");

  fsex.copyFile("./units/_gitignore", "./public/.gitignore");
  fsex.copyFile("./units/_nojekyll", "./public/.nojekyll");
  fsex.copyFile("./units/favicon.ico", "./public/favicon.ico");
  fsex.copyFile("./units/favicon.svg", "./public/favicon.svg");

  // bundle.css
  {
    const mdCss = fsex.readFile("./units/markdown.css");
    const appCss = fsex.readFile("./units/app.css");
    const cssStr = mdCss + appCss;
    const result = minifier.css(cssStr);
    fsex.writeFile("./public/bundle.css", result);
  }

  // bundle.js
  {
    const extraJs = fsex.readFile("./units/extra.js");
    const extraHtmlFileStr = fsex.readFile("./units/extra.html");
    const extraHtml = minifier.html(extraHtmlFileStr);
    const appJs = fsex.readFile("./units/app.js");
    const jsStr = extraJs.replace("/* @ extra.html */", extraHtml) + appJs;
    const result = minifier.js(`(()=>{${jsStr}})()`);
    fsex.writeFile("./public/bundle.js", result);
  }

  // check.js
  {
    const checkJs = fsex.readFile("./units/check.js");
    const result = minifier.js(checkJs);
    fsex.writeFile("./public/check.js", result);
  }
}

// Misc
{
  fsex.copyDir("./source/toys", "./public/toy");
  fsex.copyDir("./source/res", "./public/res");
}

// Pages
const pagesList = [];
{
  fsex.readDir("./source/pages").forEach((filePath) => {
    const { readMeta, content } = parseMdFile(filePath);
    const attr = {
      name: path.parse(filePath).name,
      title: readMeta("title"),
      description: readMeta("description"),
    };
    makePage({
      ...attr,
      path: `/${attr.name}/`,
      type: "markdown",
      content,
    });
    pagesList.push(attr);
  });
}

// Posts
const postsList = [];
{
  fsex.readDir("./source/posts").forEach((filePath) => {
    const { readMeta, content } = parseMdFile(filePath);
    const attr = {
      id: readMeta("date").replace(/:|-|\s/g, ""),
      date: readMeta("date").split(" ")[0],
      title: readMeta("title"),
      category: readMeta("category"),
      tags: readMeta("tags").split(" "),
      description: readMeta("description"),
    };
    makePage({
      ...attr,
      path: `/post/${attr.id}/`,
      type: "markdown",
      content,
    });
    postsList.push(attr);
    if (
      `${attr.id.slice(0, 8)}-${attr.id.slice(8, 12)} ${attr.title}` !==
      path.parse(filePath).name
    ) {
      console.warn(`filename is not standard: ${attr.title}`);
    }
  });
  postsList.sort((post1, post2) => post2.id - post1.id);
}

// Home
{
  const countPerPage = 10;
  const lastPage = Math.ceil(postsList.length / countPerPage);
  for (let curPage = 1; curPage <= lastPage; curPage++) {
    let htmlStr = "";
    for (
      let i = (curPage - 1) * countPerPage,
        maxI = i + countPerPage,
        l = postsList.length;
      i < maxI && i < l;
      i++
    ) {
      const post = postsList[i];
      htmlStr += `
        <div class="post-intro">
          <h3>
            <a href="/post/${post.id}" data-sl>${post.title}</a>
          </h3>
          <p>${post.description}</p>
          <p>
            ${post.tags
              .map(
                (tag) => `<a href="/tag/${tag}" data-sl class="chip">${tag}</a>`
              )
              .join("")}
          </p>
        </div>
      `;
    }
    htmlStr += `
      <nav class="pagination">
        <a href="/" data-sl>〈◀</a>
        <a href="${curPage > 2 ? "/home/" + (curPage - 1) : "/"}" data-sl>◀</a>
        <a href="/home/${
          curPage < lastPage ? curPage + 1 : lastPage
        }" data-sl>▶</a>
        <a href="/home/${lastPage}" data-sl>▶〉</a>
      </nav>
    `;
    if (curPage === 1) {
      makePage({
        path: "/",
        type: "html",
        title: "Homepage",
        description: "Welcome to my blog!",
        content: htmlStr,
      });
    } else {
      makePage({
        path: `/home/${curPage}/`,
        type: "html",
        title: `Home: ${curPage}`,
        content: htmlStr,
      });
    }
  }
}

// Archive
{
  const listsByYear = new Map();
  postsList.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!listsByYear.has(year)) {
      listsByYear.set(year, []);
    }
    listsByYear.get(year).push(post);
  });

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Archive</h1>";
  listsByYear.forEach((_, year) => {
    htmlStr += `<a href="/archive/${year}" data-sl class="chip">${year}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/archive/",
    type: "html",
    title: "Archive",
    content: htmlStr,
  });

  listsByYear.forEach((list, year) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${year}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/archive/${year}`,
      type: "html",
      title: `${year} - Archive`,
      content: htmlStr,
    });
  });
}

// Category
{
  const listsByCategory = new Map();
  postsList.forEach((post) => {
    if (!listsByCategory.has(post.category)) {
      listsByCategory.set(post.category, []);
    }
    listsByCategory.get(post.category).push(post);
  });

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Category</h1>";
  listsByCategory.forEach((_, category) => {
    htmlStr += `<a href="/category/${category}" data-sl class="chip">${category}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/category/",
    type: "html",
    title: "Category",
    content: htmlStr,
  });

  listsByCategory.forEach((list, category) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${category}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/category/${category}`,
      type: "html",
      title: `${category} - Category`,
      content: htmlStr,
    });
  });
}

// Tag
{
  const listsByTag = new Map();
  postsList.forEach((post) =>
    post.tags.forEach((tag) => {
      if (!listsByTag.has(tag)) {
        listsByTag.set(tag, []);
      }
      listsByTag.get(tag).push(post);
    })
  );

  let htmlStr = '<div class="chips-group">';
  htmlStr += "<h1>Tag</h1>";
  listsByTag.forEach((_, tag) => {
    htmlStr += `<a href="/tag/${tag}" data-sl class="chip">${tag}</a>`;
  });
  htmlStr += "</div>";
  makePage({
    path: "/tag/",
    type: "html",
    title: "Tag",
    content: htmlStr,
  });

  listsByTag.forEach((list, tag) => {
    let htmlStr = '<div class="posts-group">';
    htmlStr += `<h1>${tag}</h1>`;
    list.forEach((post) => {
      htmlStr += `
        <a href="/post/${post.id}" data-sl>
          <span class="chip">${post.date}</span>
          ${post.title}
        </a>
      `;
    });
    htmlStr += "</div>";
    makePage({
      path: `/tag/${tag}`,
      type: "html",
      title: `${tag} - Tag`,
      content: htmlStr,
    });
  });
}

// 404 Error
{
  makePage({
    realPath: "/404.html",
    title: "404 not found",
    type: "markdown",
    content:
      '<h1 style="text-align:center;border:none">404 not found</h1>' +
      '<script>if(location.pathname.match(/post\\/\\d{14}/)){alert("旧的14位博文ID已经弃用，将跳转到新地址。\\nOld 14-dight post id is deprecate, will jump to new address.");location.pathname=location.pathname.slice(0,18)}</script>',
  });
}

// Site Map and RSS
{
  const domain = "https://kkocdko.github.io";

  fsex.writeFile(
    "./public/robots.txt",
    `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml`
  );

  fsex.writeFile(
    "./public/sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      pagesList
        .map(({ name }) => `<url><loc>${domain}/${name}/</loc></url>`)
        .join("") +
      postsList
        .map(({ id }) => `<url><loc>${domain}/post/${id}/</loc></url>`)
        .join("") +
      "</urlset>"
  );

  fsex.writeFile(
    "./public/feed.xml",
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0">' +
      "<channel>" +
      "<title>kkocdko's blog</title>" +
      `<link>${domain}</link>` +
      "<description>kkocdko's blog</description>" +
      postsList
        .map(
          ({ id, title, description }) =>
            "<item>" +
            `<title>${title}</title>` +
            `<link>${domain}/post/${id}/</link>` +
            `<description>${description}</description>` +
            "</item>"
        )
        .join("") +
      "</channel>" +
      "</rss>"
  );
}
