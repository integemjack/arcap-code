const fs = require("fs");
const path = require("path");
const co = require("co");
const util = require("util");
// const { execSync, exec, spawn } = require("child_process");
const fsext = require("fs-extra");

co(function*() {
	let package = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")));
	// let version = package.version;
	// let versions = version.split(".");
	// versions[versions.length - 1]++;
	// package.version = versions.join(".");
	// fs.writeFileSync(path.join(__dirname, "../package.json"), JSON.stringify(package, null, 4));
	let setup = fs.readFileSync(path.join(__dirname, "setup.nsi.bak"), "utf-8");
	fs.writeFileSync(path.join(__dirname, "setup.nsi"), setup.replace(/{VERSION}/gi, package.version));
	// process.stdout.write(`change this version(${version}) to version(${package.version})`);

	process.stdout.write("Copying files...");
	const outdir = path.join(__dirname, "out");
	fsext.ensureDirSync(outdir);
	fsext.emptyDirSync(outdir);
	fsext.ensureDirSync(path.join(outdir, "command"));
	fsext.ensureDirSync(path.join(outdir, "data"));
	fsext.ensureDirSync(path.join(outdir, "data/emailData"));
	fsext.ensureDirSync(path.join(outdir, "data/userData"));
	fsext.ensureDirSync(path.join(outdir, "logs"));
	fsext.ensureDirSync(path.join(outdir, "chrome-user-data"));
	fsext.ensureDirSync(path.join(outdir, "ai"));

	let files = fs.readdirSync(path.join(process.cwd(), "ai"));
	files.forEach(file => {
		fsext.copySync(path.join(process.cwd(), "ai", file), path.join(outdir, "ai", file));
	});

	fsext.copySync(path.join(__dirname, "../exe"), path.join(outdir, "exe"));
	fsext.copySync(path.join(__dirname, "../libs/mailer/templates"), path.join(outdir, "libs/mailer/templates"));
	fsext.copySync(path.join(__dirname, "../aiConfig.bak.json"), path.join(outdir, "aiConfig.bak.json"));
	fsext.copySync(
		path.join(__dirname, "../node_modules/sqlite3/lib/binding"),
		path.join(outdir, "node_modules/sqlite3/lib/binding")
	);
	// fsext.copySync(path.join(__dirname, "../config.json"), path.join(outdir, "config.json"));
	let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.bak.json")));
	config.version = package.version;
	fs.writeFileSync(path.join(outdir, "config.bak.json"), JSON.stringify(config, null, 4));
	fsext.copySync(path.join(__dirname, "Iplayer.ico"), path.join(outdir, "Iplayer.ico"));

	// qrcode.json
	fsext.copySync(path.join(__dirname, "../models/qrcode.json"), path.join(outdir, "models/qrcode.json"));
	process.stdout.write("done.\n");

	process.stdout.write("Building arcap.exe...");
});
