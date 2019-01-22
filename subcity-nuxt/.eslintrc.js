module.exports = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true
  },
  extends: 'airbnb',
  // Required to lint *.vue files.
  plugins: [
    'html'
  ],
  rules: {},
  globals: {}
}
