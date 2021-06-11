const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../libs/config");
const moment = require("moment");
const async = require("async");
const md5 = require("md5");

// main
if (process.argv.indexOf("server") >= 2) {
	const express = require("express");
	const app = express();

	const server = require("http").Server(app);
	let address = server.listen(20180, "0.0.0.0", () => {
		console.log("Login server listening on port %s:%d", address.address().address, address.address().port);
	});
	const Server = require("socket.io")(server);

	Server.on("connection", socket => {
		console.log(`${socket.id} connected!`);
		socket.on("file", (file, content, cb = () => {}) => {
			let mainDir = config.get().storage;
			if (new RegExp("^[.]+").test(mainDir)) mainDir = path.join(process.cwd(), config.get().storage);

			let dir = path.join(mainDir, moment().format("YYYYMMDD"));

			if (
				!fs.existsSync(path.join(dir, file.name)) ||
				md5(fs.readFileSync(path.join(dir, file.name))) !== file.hash
			) {
				fs.writeFileSync(path.join(dir, file.name), content);
				console.log(`File ${file.name} is diff local file, saving it now...`);
			} else {
				console.log(`File ${file.name} is same local file, nothing to do it.`);
			}
			cb();
		});
	});
} else {
	const Client = require("socket.io-client");

	scanIP(Client)
		.then(socket => {
			listenFileSync(socket);
		})
		.catch(e => {
			console.log(e);
		});
}

// function
function scanIP(io) {
	return new Promise((resolve, reject) => {
		try {
			let networkInterfaces = os.networkInterfaces(),
				address = "";
			for (let k in networkInterfaces) {
				networkInterfaces[k].forEach(net => {
					if (/^192\.168\.[0-9\.]+/.test(net.address)) address = net.address;
				});
			}
			address = address
				.split(".")
				.filter((v, i) => i < 3)
				.join(".");

			for (let i = 2; i < 256; i++) {
				// let i = 5;
				console.log(`Try connecting to ${address}.${i}:20180...`);
				let client = io(`ws://${address}.${i}:20180`);

				client.on("connect", () => {
					console.log(`Connecting to ${address}.${i}:20180 is successfully!`);
					resolve(client);
				});
			}
		} catch (e) {
			reject(e);
		}
	});
}

function listenFileSync(socket) {
	let mainDir = config.get().storage;
	if (new RegExp("^[.]+").test(mainDir)) mainDir = path.join(process.cwd(), config.get().storage);

	let dir = path.join(mainDir, moment().format("YYYYMMDD"));

	if (fs.existsSync(dir)) {
		let files = getFiles(dir).map(r => {
			r.name = r.name.replace(dir, "").replace(/^[\\/]+/, "");
			return r;
		});

		async.each(
			files,
			(file, cb) => {
				console.log(file);
				// cb();
				try {
					socket.emit("file", file, fs.readFileSync(path.join(dir, file.name)), cb);
				} catch (e) {
					console.log(`Send file ${file.name} to server is error: ${e}`);
					cb();
				}
			},
			err => {
				setTimeout(() => {
					listenFileSync(socket);
				}, 10000);
			}
		);
	} else {
		console.log(`Can't find files, wait 10s replay.`);
		setTimeout(() => {
			listenFileSync(socket);
		}, 10000);
	}
}

function getFiles(dir) {
	let result = [];
	let files = fs.readdirSync(dir);
	files.forEach(file => {
		let stats = fs.statSync(path.join(dir, file));
		if (stats.isDirectory()) {
			getFiles(path.join(dir, file)).forEach(f => {
				result.push(f);
			});
		} else {
			result.push({ name: path.join(dir, file), hash: md5(fs.readFileSync(path.join(dir, file))) });
		}
	});

	return result;
}
