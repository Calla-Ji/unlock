/* eslint no-console: 0 */
const fs = require('fs')
const { join } = require('path')
const { promisify } = require('util')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const copyFile = promisify(fs.copyFile)

module.exports = {
  webpack: (config) => {
    // Despite being mostly Typescript-configured by default, Next
    // will fail to resolve .ts{x} files if we don't set the
    // resolvers.
    config.resolve.extensions = [...config.resolve.extensions, '.ts', '.tsx']

    return config
  },
  exportPathMap: async (defaultPathMap, { dev, dir, outDir }) => {
    // Export robots.txt in non-dev environments
    if (!dev && outDir) {
      await copyFile(
        join(dir, '..', 'public', 'static', 'unlock.latest.min.js'),
        join(outDir, 'static', 'unlock.latest.min.js')
      )

      await copyFile(
        join(dir, '..', 'public', 'robots.txt'),
        join(outDir, 'robots.txt')
      )

      // Export _redirects which is used by netlify for URL rewrites
      await copyFile(
        join(dir, '..', 'public', '_redirects'),
        join(outDir, '_redirects')
      )
    }

    return {
      '/': { page: '/home' },
    }
  },
}
