"use strict";

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const async = require("async");
const logger = require("./logger");

const CONCURRENCY = 1;

function procFfmpegTask(task, cb) {
	if (fs.existsSync(task.output)) {
		logger.info(`${task.output} file is exist, so removeing...`);
		fs.unlinkSync(task.output);
		logger.info(`${task.output} is remove!`);
	}

	logger.info(`Conversion voice model "${task.voiceMode}".`);
	let voiceOpts = ["-i", task.audio, "-filter_complex", "[1:0] apad", "-shortest"];
	switch (task.voiceMode) {
		case "Background music only":
			// no change
			break;
		case "Original voice only":
			// clear voice opts
			voiceOpts = [];
			break;
		case "Retain both":
			// process with "amix"
			// https://ffmpeg.org/ffmpeg-filters.html#amix
			voiceOpts = [
				"-i",
				task.audio,
				"-filter_complex",
				"[0:a]volume=2.0[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2[a]",
				"-map",
				"0:v",
				"-map",
				"[a]"
			];
			break;
	}

	logger.info(`Start ffmpeg merge ${task.video} and ${task.audio}, output to ${task.output}`);
	const ffmpeg = execFile(
		path.join(process.cwd(), "exe/ffmpeg.exe"),
		[
			"-i",
			task.video,
			...voiceOpts, // insert voice opts
			"-r",
			"30",
			"-s",
			task.size,
			task.output
		],
		(error, stdout, stderr) => {
			if (error) {
				if (task.voiceMode === "Retain both" && error.message.indexOf("Stream #0:1") === -1) {
					console.log('We assume that there is no audio track in .webm if "Stream #0:1" is not present');
					console.log("Reconvert video using background music only mode");
					task.voiceMode = "Background music only";
					return procFfmpegTask(task, cb);
				}
				logger.error(`ffmpeg conversion failed!`);
				return cb(error);
			}
			if (!fs.existsSync(task.output)) {
				logger.error(`Ffmpeg output file is not found!`);
				return cb("Ffmpeg no output");
			}
			logger.info(`ffmpeg conversion completed.`);
			cb();
		}
	);
}

var ffmpegQueue = async.queue(procFfmpegTask, CONCURRENCY);

function queueMergeTask(video, audio, voiceMode, size, output) {
	return new Promise((resolve, reject) => {
		var task = {
			video,
			audio,
			voiceMode,
			size,
			output
		};
		ffmpegQueue.push(task, err => {
			if (err) reject(err);
			else resolve();
		});
		logger.info(`There are ${ffmpegQueue.length()} ffmpeg tasks in queue.`);
	});
}

module.exports.merge = queueMergeTask;
