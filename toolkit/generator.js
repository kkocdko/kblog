"use strict";

console.time("generate time");
process.on("exit", () => console.timeEnd("generate time"));

const fs = require("file-system"); // This is not native fs
const path = require("path");
const childProcess = require("child_process");
const marked = require("marked");
const htmlMinifier = require("html-minifier-terser");
const CleanCss = require("clean-css");
const terser = require("terser");

const mfs = {
  r2a: require("path").join.bind(null, __dirname, ".."), // Relative to absolute
  deleteDir(path) {
    try {
      fs.rmdirSync(path);
    } catch {}
  },
  writeFile(path, data) {
    fs.writeFileSync(path, data);
  },
  readFile(path) {
    return fs.readFileSync(path);
  },
  readFileStr(path) {
    return fs.readFileSync(path).toString();
  },
  copyFile(sourcePath, targetPath) {
    fs.copyFileSync(sourcePath, targetPath);
  },
  copyDir(sourcePath, targetPath, filter = ["**/*"]) {
    fs.copySync(sourcePath, targetPath, {
      filter
    });
  },
  walkDir(dirPath, filter = ["**/*"], callback) {
    fs.recurseSync(dirPath, filter, callback);
  }
};

const minifier = {
  html(str) {
    if (process.argv.includes("--dev-mode")) {
      return str;
    }
    return htmlMinifier.minify(str, {
      collapseInlineTagWhitespace: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      continueOnParseError: true,
      removeAttributeQuotes: true,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true,
      minifyURLs: true
    });
  },
  htmlMd(str) {
    if (process.argv.includes("--dev-mode")) {
      return str;
    }
    return htmlMinifier.minify(str, {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      continueOnParseError: true,
      removeAttributeQuotes: true,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true,
      minifyURLs: true
    });
  },
  css(str) {
    if (process.argv.includes("--dev-mode")) {
      return str;
    }
    return new CleanCss({
      level: {
        1: {
          specialComments: "none"
        },
        2: {
          all: true
        }
      }
    }).minify(str).styles;
  },
  js(str) {
    if (process.argv.includes("--dev-mode")) {
      return str;
    }
    str = str.replace(/const\s/g, "let ");
    str = str.replace(/"use strict";/g, "");
    const minified = terser.minify(str, {
      compress: {
        toplevel: true,
        arguments: true,
        booleans_as_integers: true,
        drop_console: true,
        hoist_funs: true,
        passes: 3,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        toplevel: true
      }
    }).code;
    return minified.replace(/;$/, "");
  }
};

const switchGitBranch = branchName => {
  childProcess.execSync(
    `gitvars & cd ${mfs.r2a("/source")} && git checkout ${branchName}`,
    {
      stdio: "ignore"
    }
  );
};

const parseMdFile = filePath => {
  const str = mfs.readFileStr(filePath);
  const readMeta = key => {
    const matched = str.match(`\n${key}: ([^\n]*)`);
    return matched ? matched[1] : null;
  };
  const mdStr = str.slice(str.indexOf("\n```") + 4);
  const content = marked(`# ${readMeta("title")}\n\n${mdStr}\n`);
  return { readMeta, content };
};

const makePage = ({
  realPath = "",
  path = "",
  title = "",
  description = "",
  content = ""
}) => {
  content = minifier.htmlMd(content);
  let template = mfs.readFileStr(mfs.r2a("/units/page.html"));
  template = minifier.html(template);
  const result = template
    .replace(/{{ title }}/g, title)
    .replace(/{{ description }}/g, description)
    .replace(/{{ content }}/g, content);
  const targetPath = realPath
    ? mfs.r2a("/public", realPath)
    : mfs.r2a("/public", path, "index.html");
  mfs.writeFile(targetPath, result);
};

// Initialization
{
  mfs.deleteDir(mfs.r2a("/public"));

  mfs.writeFile(mfs.r2a("/public/.nojekyll"), "");
  mfs.copyFile(mfs.r2a("/units/favicon.ico"), mfs.r2a("/public/favicon.ico"));
  mfs.copyFile(mfs.r2a("/units/favicon.svg"), mfs.r2a("/public/favicon.svg"));

  // bundle.css
  {
    const mdCss = mfs.readFileStr(mfs.r2a("/units/markdown.css"));
    const appCss = mfs.readFileStr(mfs.r2a("/units/app.css"));
    let result = mdCss + appCss;
    result = minifier.css(result);
    mfs.writeFile(mfs.r2a("/public/bundle.css"), result);
  }

  // bundle.js
  {
    const extraJs = mfs.readFileStr(mfs.r2a("/units/extra.js"));
    let extraHtml = mfs.readFileStr(mfs.r2a("/units/extra.html"));
    extraHtml = minifier.html(extraHtml);
    const appJs = mfs.readFileStr(mfs.r2a("/units/app.js"));
    let result = extraJs.replace("/* @ extra.html */", extraHtml) + appJs;
    result = `(document=>{${result}})(document)`;
    result = minifier.js(result);
    mfs.writeFile(mfs.r2a("/public/bundle.js"), result);
  }

  // check.js
  {
    const checkJs = mfs.readFileStr(mfs.r2a("/units/check.js"));
    const result = minifier.js(checkJs);
    mfs.writeFile(mfs.r2a("/public/check.js"), result);
  }
}

// Misc
{
  switchGitBranch("toys");
  mfs.copyDir(mfs.r2a("/source/data"), mfs.r2a("/public/toy"), [
    "**/*",
    "!.git/**/*"
  ]);

  switchGitBranch("res");
  mfs.copyDir(mfs.r2a("/source/data"), mfs.r2a("/public/res"), [
    "**/*",
    "!.git/**/*"
  ]);
}

// Pages
const pagesList = [];
{
  switchGitBranch("pages");
  mfs.walkDir(mfs.r2a("/source/data"), ["*.md"], absolute => {
    const { readMeta, content } = parseMdFile(absolute);
    const attr = {
      name: path.parse(absolute).name,
      title: readMeta("title"),
      description: readMeta("description")
    };
    makePage({
      ...attr,
      path: `/${attr.name}/`,
      content: `<article>${content}</article>`
    });
    pagesList.push(attr);
  });
}

// Posts
const postsList = [];
{
  switchGitBranch("posts");
  mfs.walkDir(mfs.r2a("/source/data"), ["*.md"], absolute => {
    const { readMeta, content } = parseMdFile(absolute);
    const attr = {
      id: readMeta("date").replace(/:|-|\s/g, ""),
      date: readMeta("date").split(" ")[0],
      title: readMeta("title"),
      category: readMeta("category"),
      tags: readMeta("tags").split(" "),
      description: readMeta("description")
    };
    makePage({
      ...attr,
      path: `/post/${attr.id}/`,
      content: `<article>${content}</article>`
    });
    postsList.push(attr);
  });
  postsList.sort((post1, post2) => (post1.id > post2.id ? -1 : 1));
}

// Home
{
  const countPerPage = 10;
  const pageNumberMax = Math.ceil(postsList.length / countPerPage);
  for (let curPageNumber = 1; curPageNumber <= pageNumberMax; curPageNumber++) {
    let htmlStr = '<ul class="post-list">';
    for (
      let i = (curPageNumber - 1) * countPerPage,
        maxI = i + countPerPage,
        l = postsList.length;
      i < maxI && i < l;
      i++
    ) {
      const post = postsList[i];
      htmlStr += `
        <li>
          <h3>
            <a data-sl href="/post/${post.id}">${post.title}</a>
          </h3>
          <p>${post.description}</p>
          <ul class="post-footer">
            <li>
              <a data-sl href="/category#${post.category}">${post.category}</a>
            </li>
            ${post.tags
              .map(
                tag => `
                  <li>
                    <a data-sl href="/tag#${tag}">${tag}</a>
                  </li>
                `
              )
              .join("")}
          </ul>
        </li>
      `;
    }
    htmlStr += "</ul>";
    htmlStr += `
      <ul class=page-number-nav>
        <li>
          <a data-sl href=/home/1>〈◀</a>
        </li>
        <li>
          <a data-sl href=/home/${
            curPageNumber > 1 ? curPageNumber - 1 : 1
          }>◀</a>
        </li>
        <li>
          <a data-sl href=/home/${
            curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax
          }>▶</a>
        </li>
        <li>
          <a data-sl href=/home/${pageNumberMax}>▶〉</a>
        </li>
      </ul>
    `;
    makePage({
      path: `/home/${curPageNumber}/`,
      title: `Home: ${curPageNumber}`,
      content: htmlStr
    });
    if (curPageNumber === 1) {
      makePage({
        path: "/",
        title: `Home: ${curPageNumber}`,
        content: htmlStr
      });
    }
  }
}

// Archive
{
  makePage({
    path: "/archive/",
    title: "Archive",
    content: `
      <ul class="post-list compact">
        <li>
          <h2>Archive</h2>
          ${postsList
            .map(
              post => `
                <h3>
                  <a data-sl href="/post/${post.id}">
                    <span class="post-date">${post.date}</span>
                    ${post.title}
                  </a>
                </h3>
              `
            )
            .join("")}
        </li>
      </ul>
    `
  });
}

// Category
{
  const listsByCategory = new Map();
  postsList.forEach(post => {
    if (!listsByCategory.has(post.category)) {
      listsByCategory.set(post.category, []);
    }
    listsByCategory.get(post.category).push(post);
  });

  let htmlStr = '<ul class="post-list compact">';
  listsByCategory.forEach((list, category) => {
    htmlStr += `<li id="${category}">` + `<h2>${category}</h2>`;
    list.forEach(post => {
      htmlStr += `
        <h3>
          <a data-sl href="/post/${post.id}">${post.title}</a>
        </h3>
      `;
    });
    htmlStr += "</li>";
  });
  htmlStr += "</ul>";
  makePage({
    path: "/category/",
    title: "Categories",
    content: htmlStr
  });
}

// Tag
{
  const listsByTag = new Map();
  postsList.forEach(post =>
    post.tags.forEach(tag => {
      if (!listsByTag.has(tag)) {
        listsByTag.set(tag, []);
      }
      listsByTag.get(tag).push(post);
    })
  );

  let htmlStr = '<ul class="post-list compact">';
  listsByTag.forEach((list, tag) => {
    htmlStr += `<li id="${tag}">` + `<h2>${tag}</h2>`;
    list.forEach(post => {
      htmlStr += `
        <h3>
          <a data-sl href="/post/${post.id}">${post.title}</a>
        </h3>
      `;
    });
    htmlStr += "</li>";
  });
  htmlStr += "</ul>";
  makePage({
    path: "/tag/",
    title: "Tags",
    content: htmlStr
  });
}

// 404 Error
{
  makePage({
    realPath: "/404.html",
    title: "404 not found",
    content:
      "<article><h1 style=text-align:center;border:none>404 not found</h1></article>"
  });
}

// Site Map
{
  mfs.writeFile(
    mfs.r2a("/public/sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      pagesList
        .map(
          ({ name }) =>
            `<url><loc>https://kkocdko.github.io/${name}/</loc></url>`
        )
        .join("") +
      postsList
        .map(
          ({ id }) =>
            `<url><loc>https://kkocdko.github.io/post/${id}/</loc></url>`
        )
        .join("") +
      "</urlset>"
  );
}

// RSS
{
  mfs.writeFile(
    mfs.r2a("/public/feed.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0">' +
      "<channel>" +
      "<title>kkocdko's blog</title>" +
      "<link>https://kkocdko.github.io</link>" +
      "<description>kkocdko's personal blog</description>" +
      postsList
        .map(
          ({ id, title, description }) =>
            "<item>" +
            `<title>${title}</title>` +
            `<link>https://kkocdko.github.io/post/${id}/</link>` +
            `<description>${description}</description>` +
            "</item>"
        )
        .join("") +
      "</channel>" +
      "</rss>"
  );
}
