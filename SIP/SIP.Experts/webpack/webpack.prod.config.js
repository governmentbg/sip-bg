const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.js');
const path = require("path");
const webpack = require("webpack");

module.exports = merge(baseConfig, {
	output: {
		path: path.join(__dirname, "../", "build")
	},
});
module.exports.plugins.unshift(
	new webpack.DefinePlugin({
		'webpack': {
		  production: true,
		  core: JSON.stringify("esri"),
		  configFile: JSON.stringify("configs/config.js")
		},
		'__VERSION__DATE__': JSON.stringify(new Date().toLocaleDateString())
	})
)