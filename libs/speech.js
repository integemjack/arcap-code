"use strict";

const fs = require("fs");
const path = require("path");

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "../cert/google.json");

const { execFile } = require("child_process");

const Google = require("@google-cloud/speech");
const speech_google = new Google.SpeechClient();

const AipSpeechClient = require("baidu-aip-sdk").speech;
const baidu_config = JSON.parse(fs.readFileSync(path.join(__dirname, "../cert/baidu.json")));
const speech_baidu = new AipSpeechClient(baidu_config.APP_ID, baidu_config.API_KEY, baidu_config.SECRET_KEY);

const baidu = (content, cb) => {
	speech_baidu
		.recognize(new Buffer(content), "wav", 16000, {
			dev_pid: "1936"
		})
		.then(
			result => {
				console.log("BAIDU result] -> " + JSON.stringify(result));
				if (result.result) {
					cb(null, result.result[0]);
				} else {
					cb(JSON.stringify(result), null);
				}
			},
			err => {
				console.log(err);
				cb(err, null);
			}
		);
};

const google = (content, cb) => {
	let request = {
		audio: { content: content.toString("base64") },
		config: {
			encoding: "LINEAR16",
			sampleRateHertz: 16000,
			languageCode: "en-US"
		}
	};
	speech_google
		.recognize(request)
		.then(data => {
			const response = data[0];
			const transcription = response.results.map(result => result.alternatives[0].transcript).join("\n");
			cb(null, transcription);
			console.log(`Transcription: ${transcription}`);
		})
		.catch(err => {
			cb(err, null);
			console.error("ERROR:", err);
		});
};

const ffmpeg = content => {
	return new Promise((resolve, reject) => {
		let file = path.join(process.cwd(), "audio", `${new Date().getTime()}`);
		fs.writeFileSync(`${file}.wav`, content);
		execFile(
			path.join(process.cwd(), "exe/ffmpeg.exe"),
			["-i", `${file}.wav`, "-ar", 16000, `${file}_c.wav`],
			error => {
				if (!error) {
					let c = fs.readFileSync(`${file}_c.wav`);
					resolve(c);
				} else {
					reject(error);
				}
			}
		);
	});
};

exports = module.exports = {
	baidu,
	google,
	ffmpeg
};
