const fs = require("fs");
const path = require("path");

const { execFile } = require("child_process");
const moment = require("moment");
const ffmpeg = require("../libs/ffmpeg");
const Vimeo = require("../libs/vimeo").Vimeo;
const creator = require("../libs/creator");

(async (_path, upload) => {

	if (/\.webm$/.test(_path)) {
		let vimeo = new Vimeo();
		let ids = _path.split("_");
		if (ids.length > 3) {
			let fileOutput = `${_path}.mp4`;
			if (!fs.existsSync(fileOutput)) await ffmpeg.merge(_path, "", "Original voice only", "1280*720", fileOutput);
			let link = await vimeo.upload(fileOutput);
			console.log(`[link: ${__filename}:20]`, link);

			let id = ids[ids.length - 1].split(".")[0];
			await creator.addVimeo(id, link);
			console.log(`This [${_path}] is do finished.`);
		} else {
			console.log(`This is not a valid video recorded by the creator.integem.com theme!`);
		}
	} else if (/\.[jpg|png|jpeg]+$/.test(_path)) {
		// console.log(_path);
		let ids = _path.split("_");
		if (ids.length > 3) {
			let id = ids[ids.length - 1].split(".")[0];
			await creator.addJpg(id, _path);
			console.log(`This [${_path}] is do finished.`);
		} else {
			console.log(`This is not a valid photo recorded by the creator.integem.com theme!`);
		}
	} else {
		console.log(`This [${_path}] is not a webm file.`);
	}

})(process.argv[2], process.argv[3]);
