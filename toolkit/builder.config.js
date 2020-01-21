const rp = require('path').join.bind(null, __dirname, '..')
module.exports = {
  site: {
    defaultTitle: 'kkocdko\'s blog',
    userName: 'kkocdko',
    domain: 'https://kkocdko.github.io'
  },
  dir: {
    root: rp('/'),
    source: {
      root: rp('/source'),
      media: rp('/source/media'),
      pages: rp('/source/pages'),
      posts: rp('/source/posts')
    },
    swatch: {
      root: rp('/swatch'),
      res: rp('/swatch/res')
    },
    public: {
      root: rp('/public'),
      res: rp('/public/res'),
      media: rp('/public/res/media'),
      pages: rp('/public/res/pages'),
      posts: rp('/public/res/posts')
    }
  },
  compressor: {
    htmlMinifier: {
      collapseInlineTagWhitespace: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      continueOnParseError: true,
      removeAttributeQuotes: true,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true
    },
    htmlMinifierMd: {
      collapseInlineTagWhitespace: false
    },
    cleanCss: {
      level: {
        1: { specialComments: 'none' },
        2: { all: true }
      }
    },
    terser: {
      compress: {
        toplevel: true,
        arguments: true,
        booleans_as_integers: true,
        drop_console: true,
        hoist_funs: true,
        passes: 2,
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
      mangle: { toplevel: true }
    }
  },
  developMode: process.argv.includes('--dev-mode')
}
