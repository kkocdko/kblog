module.exports = {
  site: {
    title: 'K\'s Blog',
    name: 'kkocdko',
    domain: 'https://kkocdko.github.io'
  },
  directories: {
    root: `${__dirname}/..`,
    source: {
      develop: `${__dirname}/../dev`,
      article: `${__dirname}/../_post`,
      page: `${__dirname}/../_page`,
      image: `${__dirname}/../_img`
    },
    dist: {
      root: `${__dirname}/../dist`,
      article: `${__dirname}/../dist/src/article`,
      page: `${__dirname}/../dist/src/page`,
      json: `${__dirname}/../dist/src/json`,
      image: `${__dirname}/../dist/src/img`
    }
  },
  compressor: {
    cleancss: {
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
