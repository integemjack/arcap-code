module.exports = [{
    entry: {
        loginapp: __dirname + "/vue/loginapp/main.js",
        qrcodeapp: __dirname + "/vue/qrcodeapp/main.js"
    },
    output: {
        path: __dirname + "/static/js/",
        filename: "[name]-bundle.js"
    },
    devtool: "cheap-module-source-map",
    module: {
        rules: [{
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.js$/,
                loader: "babel-loader"
            },
            {
                test: /\.css$/,
                loader: "css-loader"
            },
            {
                test: /\.(ico|eot|otf|webp|ttf|woff|woff2)(\?.*)?$/,
                use: "file-loader?limit=100000"
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [
                    "file-loader?limit=100000",
                    {
                        loader: "img-loader",
                        options: {
                            enabled: true,
                            optipng: true
                        }
                    }
                ]
            }
        ]
    }
}];