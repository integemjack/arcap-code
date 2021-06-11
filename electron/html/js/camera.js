"use strict";

const fs = require("fs");
const path = require("path");
const toBuffer = require("blob-to-buffer");

let recordData = null;
let mediaRecorder = null;

init();

function init(id, cb) {
	let videoDeviceId = id || undefined;
	// 启动获取摄像头数据
	navigator.mediaDevices
		.getUserMedia({
			audio: false,
			video: { width: 1920, height: 1080, deviceId: videoDeviceId },
			framerate: 30
		})
		.then(stream => {
			recordData = stream;
		})
		.catch(cb);
}

// 录制视频并在结束后保存视频
function startRecord(opts, file_path) {
	return new Promise((resolve, reject) => {
		let chunks = [];

		let options = { mimeType: "video/webm" };
		if (opts) {
			if (opts.codecs) {
				options.mimeType = `video/webm;codecs=${opts.codecs}`;
			}
			if (opts.videoBitrate) {
				options.videoBitsPerSecond = parseInt(opts.videoBitrate);
			}
			if (opts.audioBitrate) {
				options.audioBitsPerSecond = parseInt(opts.audioBitrate);
			}
		}

		try {
			mediaRecorder = new MediaRecorder(recordData, options);
		} catch (e) {
			reject(e);
		}

		mediaRecorder.ondataavailable = e => {
			chunks.push(e.data);
			console.log(e.data);
		};
		mediaRecorder.onstop = e => {
			// 保存文件
			const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
			toBuffer(blob, function(err, buffer) {
				if (err) throw err;

				fs.writeFileSync(file_path, buffer);
				$("#video").attr("src", `file://${file_path}`);
			});

			mediaRecorder = null;
			chunks = null;
			resolve();
		};
		mediaRecorder.start();

		// 是否设置自动结束时间
		if (opts.maximumTime && opts.maximumTime > 0) {
			setTimeout(() => {
				mediaRecorder.stop();
			}, opts.maximumTime);
		}
	});
}

function stopRecord() {
	mediaRecorder.stop();
}
