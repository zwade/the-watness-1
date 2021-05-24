const path = require('path');

module.exports = {
	entry: './src/handler.ts',
	mode: 'development',
	module: {
		rules: [
		    {
    			test: /\.(wasm|mp3)$/,
    			type: "javascript/auto",
    			loader: "file-loader",
    		},
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		]
	},
	resolve: {
		extensions: [ '.ts', '.js', '.wasm', '.mp3' ]
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: 'dist/',
	}
};