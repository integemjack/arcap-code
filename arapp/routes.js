"use strict";

const path = require("path");
const express = require("express");
const { toAbsolute } = require("../libs/utils");
const config = require("../libs/config").get();
const router = express.Router();
const fsext = require("fs-extra");
const request = require("request");
const ini = require("ini");

router.get("/", (req, res, next) => {
	res.render("index", { config: config });
});

// AR backend will make request to /ARprojectName to send stages
router.get("/ARprojectName", (req, res, next) => {
	let ario = req.app.get("ario");
	// pass stage infomation to socketio/ario module to take next action
	ario.emitStage(req.query);
	res.send("success");
});

router.get("/ErrorMessage", (req, res, next) => {
	let ario = req.app.get("ario");
	// pass stage infomation to socketio/ario module to take next action
	// ario.emitStage(req.query);

	let configFolder = toAbsolute(config.theme);
	let stageconf = path.join(configFolder, "stageconfig.txt");

	// fsext.writeFileSync(path.join(require('os').homedir(), 'desktop/integemCamErr.txt'), req.query.ErrorMsg);
	let stageconfig = ini.parse(fsext.readFileSync(stageconf, "utf8"));
	let querys = JSON.parse(JSON.stringify(req.query));
	querys.project = stageconfig.currentFolder;
	let args = Object.keys(querys);
	let parms = args.map(a => `${a}=${querys[a]}`);
	console.log(`parms ->`, parms);
	request(`http://127.0.0.1:3000/error?${parms.join("&")}`);
	ario.emitStop();
	let log = require("child_process").execSync(`tasklist /M integem*`);
	let list = log.toString().split(/\r|\n|\r\n/g);

	let lists = list
		.filter(l => /integem/gi.test(l))
		.map(l => {
			let _l = l.split(/ +/g);
			return _l;
		});
	console.log(lists);

	lists.forEach(l => {
		let _log = require("child_process").execSync(`taskkill /T /F /PID ${l[1]}`);
		console.log(_log.toString());
	});
	if (fsext.existsSync(path.join(req.query.ReportBugProject, "stageconfig.txt"))) {
		fsext.copyFileSync(path.join(req.query.ReportBugProject, "stageconfig.txt"), stageconf);

		ario.emitStart({});
		console.log(`**** ario ->`, ario);
	}
	res.send("ok");
});

module.exports = router;
