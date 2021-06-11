const fs = require("fs");
const path = require("path");

const { execFile } = require("child_process");
const moment = require("moment");
const ffmpeg = require("../libs/ffmpeg");
const Vimeo = require("../libs/vimeo").Vimeo;
const creator = require("../libs/creator");

(async _path => {

	if (/\.webm$/.test(_path)) {
		let vimeo = new Vimeo();
		let ids = _path.split("_");
		if (ids.length > 3) {
			let fileOutput = `${_path}.mp4`;
			if (!fs.existsSync(fileOutput)) await ffmpeg.merge(_path, "", "Original voice only", "1280*720", fileOutput);
			console.log(`This [${_path}] is do finished.`);
		} else {
			console.log(`This is not a valid video recorded by the creator.integem.com theme!`);
		}
	} else {
		console.log(`This [${_path}] is not a webm file.`);
	}

})(process.argv[2]);
