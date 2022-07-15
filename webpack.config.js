const path = require("path");

module.exports = {
    entry: "./src/index.ts",

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },

    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                exclude: [ path.resolve(__dirname, "node_modules") ],
                include: [ path.resolve(__dirname, "src") ],
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-typescript"]
                        }
                    }
                ]
            }
        ],
    },

    // Specifies integrated module set for Webpack
    target: "node",

    resolve: {
        extensions: [".ts", ".js"]
    },
    
    externals: ['utf-8-validate', 'bufferutil', 'mongodb-client-encryption', 'aws4', 'snappy', 'kerberos', 'bson-ext']
};