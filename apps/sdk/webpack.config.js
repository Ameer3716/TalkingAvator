const path = require('path');

module.exports = {
  entry: './digital-human-sdk.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'digital-human-sdk.umd.js',
    library: 'DigitalHumanSDK',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  // Add configurations for ESM and CJS outputs if needed
};