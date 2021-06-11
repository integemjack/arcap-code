$(function() {
	const IO = require("socket.io")(8444);

	IO.on("connection", socket => {
		console.log(`${socket.id} connected.`);

		socket.on("startRecirding", (opts, _path, cb) => {
			console.log(opts, _path);
			startRecord(opts, _path).then(() => {
				console.log(opts, _path, "stop");
				cb();
			});
		});

		socket.on("stopRecording", () => {
			stopRecord();
		});

		socket.on("videoDeviceId", (id, cb) => {
			console.log("重新初始化摄像头设备");
			init(id, cb);
		});
	});
});
