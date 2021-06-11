/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

"use strict";

/* globals MediaRecorder, MediaSource, trace */

var mediaRecorder;
var recordedBlobs;

var gumVideo = document.querySelector("video#camera");

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === "https:" ||
	location.hostname === "localhost";
if (!isSecureOrigin) {
	alert("getUserMedia() must be run from a secure origin: HTTPS or localhost." +
		"\n\nChanging protocol to HTTPS");
	location.protocol = "HTTPS";
}

function handleVideoSuccess(videostream) {
	console.log("getUserMedia() got video stream");
	window.stream = videostream;
	gumVideo.srcObject = videostream;

	let videotrack = videostream.getVideoTracks()[0];
	videotrack.onended = function() {
		console.warn("Video ended, restart camera!");
		window.stream.getTracks().forEach(track => {
			track.stop();
		});
		window.stream = null;
		if (zconfig && zconfig.Camera2DPara && zconfig.Camera2DPara.Camera2DOption !== 2) {
			// initialCamera();
		}
	};

	var audioDeviceId = config && config.device.audioDeviceId || undefined;
	console.log("config.device.audioDeviceId =", audioDeviceId);
	navigator.mediaDevices.getUserMedia({
		audio: {
			deviceId: audioDeviceId
		},
		video: false
	}).then(handleAudioSuccess).catch(handleAudioError);
}

function handleAudioSuccess(audiostream) {
	console.log("getUserMedia() got audio stream");
	window.audioStream = audiostream;

	audiostream.getAudioTracks().forEach(track => {
		window.stream.addTrack(track);
	});
	$("div.initScreen").remove();
}

function handleVideoError(err) {
	console.log("navigator.getUserMedia error: ", err);
	// $('div.initScreen').remove();
	// error('Initialize video failed!');
	if (zconfig && zconfig.Camera2DPara && zconfig.Camera2DPara.Camera2DOption !== 2) {
		initialCamera();
	}
}

function handleAudioError(err) {
	console.log("navigator.getUserMedia error: ", err);
	$("div.initScreen").remove();
	// error('Initialize audio failed!');
}

function initialCamera() {
	console.log(`initialCamera...`);
	$("div.initScreen").show();
	var videoDeviceId = config && config.device.videoDeviceId || undefined;
	console.log("config.device.videoDeviceId =", videoDeviceId);
	var width = config.capture.size.split("*")[0];
	var height = config.capture.size.split("*")[1];
	var options = {
		audio: false,
		video: {
			// width: { exact: width },
			// height: { exact: height },
			width,
			height,
			deviceId: videoDeviceId,
			// frameRate: { exact: config.capture.frameRate }
			frameRate: config.capture.frameRate
		}
	};
	console.log("options = ", options);
	navigator.mediaDevices.getUserMedia(options).then(handleVideoSuccess).catch(handleVideoError);
}

function closeVideo() {
	console.log(`Close video stream...`)
	if (window.stream) {
		window.stream.getTracks().forEach(function(track) {
			console.log(`track ->`, track)
			track.stop();
		});
		// window.stream.stop();
		window.stream = null;
	}
}

// if(zconfig && zconfig.Camera2DPara && zconfig.Camera2DPara.Camera2DOption !== 2) {
// initialCamera();
// }

function handleDataAvailable(cb, event) {
	if (event.data && event.data.size > 0) {
		cb(event.data);
	}
}

function handleStop(event) {
	console.log("Recorder stopped: ", event);
}

function startRecording(opts, cb, tream = window.stream) {
	if (!window.record) {
		window.record = true;

		var options = { mimeType: "video/webm" };
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
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.log(options.mimeType + " is not Supported");
			options = { mimeType: "video/webm" };
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				console.log(options.mimeType + " is not Supported");
				options = "";
			}
		}

		try {
			trace(`Media recorder with options: ${JSON.stringify(options)}`);
			mediaRecorder = new MediaRecorder(stream, options);
		} catch (e) {
			console.error("Exception while creating MediaRecorder: " + e);
			alert("Exception while creating MediaRecorder: " +
				e + ". mimeType: " + options.mimeType);
			return;
		}
		console.log("Created MediaRecorder", mediaRecorder, "with options", options);
		mediaRecorder.onstop = handleStop;
		mediaRecorder.ondataavailable = handleDataAvailable.bind(null, cb);
		mediaRecorder.start(1000);
		console.log("MediaRecorder started", mediaRecorder);
	} else {
		console.log("Recording now!!!");
	}
}

function stopRecording(cb) {
	if (window.record) {
		window.record = false;
		mediaRecorder.stop();
		cb();
	}
}

function takePhoto(cb) {
	// var startTime = (new Date()).getTime();
	var canvas = document.querySelector("canvas#canvas");
	canvas.width = gumVideo.videoWidth;
	canvas.height = gumVideo.videoHeight;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(gumVideo, 0, 0, canvas.width, canvas.height);
	// var drawTime = (new Date()).getTime();
	canvas.toBlob(function(image) {
		// var endTime = (new Date()).getTime();
		// trace('Start taking photo: '+ startTime + ', finish taking photo: ' + endTime + ', duration: ' + (endTime - startTime) + ', step drawImage: ' + (drawTime - startTime) + ', step toBlob: ' + (endTime - drawTime) + ', quit: ' + (quitTime - startTime));
		cb(image);
	}, "image/jpeg", 1.0);
	// var quitTime = (new Date()).getTime();
}

function audioRecording(cb) {
	// 通过 MediaRecorder 记录获取到的媒体流
	trace(`Please saying something now!`);
	let recordRTC = RecordRTC(window.audioStream, {
		type: "audio",
		numberOfAudioChannels: 1,
		bufferSize: 8192
	});
	recordRTC.clearRecordedData();
	recordRTC.startRecording();
	setTimeout(() => {
		trace(`Stop saying and process ...`);
		recordRTC.stopRecording(function(audioURL) {
			socket.emit("speech", recordRTC.getBlob(), (err, text) => {
				// console.log(err, text);
				cb(err, text, () => {
					recordRTC.destroy();
					audioRecording(cb);
				});
			});
		});
	}, 5000);

}
