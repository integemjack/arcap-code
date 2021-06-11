const fs = require("fs");
const path = require("path");
const chromeLauncher = require("./libs/chrome-launcher");
const logger = require("./libs/logger");

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config.bak.json")));
logger.info(`This is Integem iPlayer, this version is ${config.version}`);

logger.info("Current working directory:", process.cwd());

process.on("uncaughtException", exception => {
    logger.error("uncaughtException");
    logger.error(exception);
});

process.on("unhandledRejection", (reason, p) => {
    logger.error("unhandledRejection");
    logger.error(reason);
});

// Setup AR machine server
const credentials = {
    key: fs.readFileSync(path.join(__dirname, "./cert/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "./cert/cert.pem"))
};

const arapp = require("./arapp");
const arserver = require("https").Server(credentials, arapp);
const ario = require("./socketio/ario")(arserver);
// Passing socket.io, allow routes to call ario functions.
arapp.set("ario", ario);

let ar = arserver.listen(process.env.PORT || 8443, () => {
    logger.info("AR server listening on port %s:%d", ar.address().address, ar.address().port);
    if (process.argv.indexOf("open") >= 2) {
        let fakeFlags = ["--start-maximized"];
        if (process.argv.indexOf("fake") >= 2) {
            fakeFlags.push("--use-fake-device-for-media-stream");
        }
        if (process.argv.indexOf("debug") >= 2) {
            fakeFlags.push("--enable-logging");
            fakeFlags.push("--v=1");
        }
        // Start AR desktop
        const chrome = chromeLauncher.launch({
            params: [
                `--user-data-dir=${path.join(process.cwd(), "chrome-user-data")}`,
                ...fakeFlags,
                "https://localhost:8443"
            ]
        });
        chrome.on("exit", () => {
            logger.info("Chrome exit.");
            process.exit();
        });
        process.on("SIGINT", () => {
            logger.info("Ctrl-C exit.");
            chrome.kill("SIGINT");
            process.exit(130);
        });
    }
});

// Setup mobile login server
const loginapp = require("./loginapp");
const loginservers = require("https").Server(credentials, loginapp);
const loginserver = require("http").Server(loginapp);
// Passing ario, allow controlling AR machine from login page
const loginios = require("./socketio/loginio")(loginservers, ario, loginapp);
const loginio = require("./socketio/loginio")(loginserver, ario, loginapp);

let logins = loginservers.listen(parseInt(process.env.PORT) + 1 || 2012, "0.0.0.0", () => {
    logger.info("Login server listening on port %s:%d", logins.address().address, logins.address().port);
});
let login = loginserver.listen(parseInt(process.env.PORT) + 10 || 20120, "0.0.0.0", () => {
    logger.info("Login server listening on port %s:%d", login.address().address, login.address().port);
});

// Setup mobile QRcode server
const QRcodeapp = require("./qrcodeapp");
const QRcodeservers = require("https").Server(credentials, QRcodeapp);
const QRcodeserver = require("http").Server(QRcodeapp);
// Passing ario, allow controlling AR machine from QRcode page
const QRcodeio = require("./socketio/qrcodeio")(QRcodeserver, ario);
const QRcodeios = require("./socketio/qrcodeio")(QRcodeservers, ario);

let QRcodes = QRcodeservers.listen(parseInt(process.env.PORT) + 2 || 2018, "0.0.0.0", () => {
    logger.info("QRcode server listening on port %s:%d", QRcodes.address().address, QRcodes.address().port);
});

let QRcode = QRcodeserver.listen(parseInt(process.env.PORT) + 20 || 20180, "0.0.0.0", () => {
    logger.info("QRcode server listening on port %s:%d", QRcode.address().address, QRcode.address().port);
});

// A bug in Windows node server is causing the socket.io-client's emitted message doesn't dispatch in time.
// The execution of function that scheduled by process.nextTick is delayed, it needs some actions to trigger the event loop.
// Here is our trigger that just work!
if (process.platform.startsWith("win")) {
    setInterval(function() {}, 500);
}

// run a electron in child_process
// const { fork } = require("child_process");
// fork("./electron/shell.js");

//processDB数据库的初始化 （storage的email和dateTime的关系存入processDB）
const ProcessDB = require("./libs/processDb");
ProcessDB.init(); //update 是广度的比较

let schedule = require("node-schedule");
let rule = new schedule.RecurrenceRule();
rule.hour = 0; //00:05:00
rule.minute = 5;
rule.second = 0;
// rule.second = [0,10,20,30,40,50]; //test data
//refresh at 00:05:00
schedule.scheduleJob(rule, function() {
    var today = ProcessDB.getTime(); //getTime() 是返回yyyymmdd格式的日期 顺手就放在processordb.js文件夹下
    var yesterday = ProcessDB.getTime(new Date(new Date().getTime() - 24 * 60 * 60 * 1000));
    ProcessDB.updateForce([today, yesterday]);
});