const fs = require("fs");
const fsext = require("fs-extra");
const unzip = require("unzip");
const request = require("request");

if (process.platform.startsWith("win")) {
	if (!fs.existsSync("./Tools/SQLiteStudio")) {
		console.log("Downloading SQLiteStudio ...");
		request({ url: "https://sqlitestudio.pl/files/sqlitestudio3/complete/win32/sqlitestudio-3.1.1.zip" }).pipe(
			unzip.Extract({ path: "./Tools" })
		);
	}
}

fsext.copyFileSync("./libs/chrome-launcher/flags.js", "./node_modules/chrome-launcher/dist/flags.js");
