const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const DojoWebpackPlugin = require("dojo-webpack-plugin");
const requiredPlugins = require("./arcgis-webpack/lib/requiredPlugins");
const features = require("./arcgis-webpack/lib/features");
const userExclusions = require("./arcgis-webpack/lib/userExclusions");
const webpack = require("webpack");

//const ArcGISPlugin = require("@arcgis/webpack-plugin");

const path = require("path");

class ArcGISPlugin {
	constructor(options = {}) {
		this.options = {
			useDefaultAssetLoaders: true,
			features: {
				"3d": true
			},
			userDefinedExcludes: [],
			globalContext: path.join(__dirname, "node_modules", "arcgis-js-api"),
			environment: {
				root: options.root || "."
			},
			buildEnvironment: {
				root: "node_modules"
			}
		};
		this.options = { ...this.options, ...options, ...options.options };
		if (!this.options.loaderConfig) {
			this.options.loaderConfig = require("./arcgis-webpack/lib/loaderConfig");
		}
	}

	apply(compiler) {
		compiler.options.module.rules = compiler.options.module.rules || [];
		compiler.options.module.rules.push({
			test: /@dojo/,
			use: "umd-compat-loader"
		});
		if (this.options.useDefaultAssetLoaders) {
			if (this.options.features["3d"] == false) {
				compiler.options.module.rules.push(features["3d"]);
			}
			if (this.options.userDefinedExcludes && this.options.userDefinedExcludes.length) {
				compiler.options.module.rules.push(userExclusions(this.options.userDefinedExcludes));
			}
		}
		this.dojoPlugin = new DojoWebpackPlugin(this.options);
		requiredPlugins.unshift(this.dojoPlugin);
		requiredPlugins.forEach(plugin => plugin.apply(compiler));
	}
};

module.exports = {
	entry: {
		index: "./src/index.tsx"
	},
	output: {
		filename: "public/[name].bundle.js",
		publicPath: "",
		path: __dirname + '/build'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				options: {
					transpileOnly: true
				}
			},
			{
				test: /\.(jpe?g|gif|png|webp)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "public/[name].[ext]"
						},
					},
				]
			},
			{
				test: /.(wsv|ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "public/[name].[ext]"
						},
					},
				]
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: "html-loader",
						options: { minimize: false }
					}
				],
				exclude: /node_modules/
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
			},
			{
				test: /\.less$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader',
					},
					{
						loader: 'css-loader',
						options: {
							sourceMap: true,
						},
					},
				]
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(["dist"]),
		new CopyWebpackPlugin(
			[
				{
					from: "src/public",
					to: "public"
				},
				{
					from: "src/core/public",
					to: "public"
				},
				{
					from: "src/core/configs",
					to: "configs"
				},
				{
					from: "src/configs",
					to: "configs"
				}
			]
		),
		new ArcGISPlugin(),
		new HtmlWebPackPlugin({
			template: "./src/index.html",
			filename: "./index.html",
			chunksSortMode: "none"
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		}),
		new webpack.DefinePlugin({
			'webpack': {
			  production: true,
			  core: JSON.stringify("esri"),
			  configFile: JSON.stringify("configs/config.js")
			},
			'__VERSION__DATE__': JSON.stringify(new Date().toLocaleDateString())
		}),
	],
	resolve: {
		modules: [path.resolve(__dirname, "/src"), "node_modules/"],
		extensions: [".ts", ".tsx", ".js", ".scss"]
	},
	externals: [
		(context, request, callback) => {
			if (/pe-wasm$/.test(request)) {
				return callback(null, "amd " + request);
			}
			callback();
		}
	],
	node: {
		process: false,
		global: false
	}
};
