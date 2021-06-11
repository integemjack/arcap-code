"use strict";

const fs = require("fs");
const path = require("path");
const log4js = require("log4js");

const logFolder = path.join(process.cwd(), "logs/");

if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
}

log4js.configure({
    appenders: [{
            type: "console"
        },
        {
            type: "dateFile",
            filename: logFolder,
            pattern: "yyyy-MM-dd.log",
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            backups: 4, // 日志备份数量，大于该数则自动删除
            category: "system"
        }
    ],
    replaceConsole: true // 替换 console.log
});

const logger = log4js.getLogger("system");

exports = module.exports = logger;