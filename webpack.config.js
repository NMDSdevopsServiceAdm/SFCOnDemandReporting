const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const externals = [];
if (process.env.NODE_ENV === 'production') externals.push('aws-sdk');

 const lambdaFunctions = {
  entry: {
    snapshotReport: ['babel-polyfill', './src/api/snapshotReport.js'],
    ingestEstablishments: ['babel-polyfill', './src/api/ingestEstablishments.js'],
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: '[name].js',
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [{
      test: /\.(js)$/,
      use: 'babel-loader',
      exclude: /node_modules/
    }],
  },
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, './serverless.yml'),
      to: path.resolve(__dirname, './lib')
    }])
  ],
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  externals
};

module.exports = [lambdaFunctions];
