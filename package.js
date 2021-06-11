const fs = require("fs");
const path = require("path");

let package = JSON.parse(fs.readFileSync(path.join(__dirname, "./package.json")));
let version = package.version;
let versions = version.split(".");
versions[versions.length - 1]++;
package.version = versions.join(".");
fs.writeFileSync(path.join(__dirname, "./package.json"), JSON.stringify(package, null, 4));