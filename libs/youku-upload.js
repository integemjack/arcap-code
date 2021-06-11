const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require("crypto");
const dns = require("dns");
const co = require("co");
const axios = require("axios");
const querystring = require("querystring");
const md5f = require("md5-file");

const fsopen = util.promisify(fs.open);
const fsread = util.promisify(fs.read);
const lookup = util.promisify(dns.lookup);
const md5file = util.promisify(md5f);

/*
 * Upload video file to Youku
 *
 * Sample:
 *
 * let youkuUpload = require('./youku-upload');
 * youkuUpload({
 *   client_id: '0d528cd5f5c9cece',
 *   access_token: '29a1ac96555032c97077dd725b516083',
 *   title: 'hello test',
 *   tags: 'basketball,sport',
 *   file_name: path.join(__dirname,'abc.webm')
 * }).then(video_id => {
 *   console.log(video_id)
 * }).catch(err => {
 *   console.error(err)
 * });
 */
module.exports = co.wrap(function*(info) {
	if (!fs.existsSync(info.file_name) || !fs.statSync(info.file_name).isFile()) {
		throw new Error(`File not found: ${info.file_name}`);
	}

	let file_size = fs.statSync(info.file_name).size;

	// request upload token
	console.log("create upload");
	var res = yield axios.get("https://api.youku.com/uploads/create.json", {
		params: {
			tags: info.tags,
			title: info.title,
			client_id: info.client_id,
			access_token: info.access_token,
			file_md5: yield md5file(info.file_name),
			file_name: path.basename(info.file_name),
			file_size
		}
	});

	if (res.status !== 201) {
		throw new Error("create upload token failed!");
	}

	let { upload_server_uri, upload_token } = res.data;

	let upload_server_ip = (yield lookup(upload_server_uri)).address;
	console.log("upload server:", upload_server_ip);

	// create file
	console.log("create file");
	res = yield axios.post(
		`http://${upload_server_ip}/gupload/create_file`,
		querystring.stringify({
			upload_token,
			file_size,
			ext: path.extname(info.file_name),
			slice_length: 2048
		})
	);

	if (res.status !== 201) {
		throw new Error("create file failed!");
	}

	// upload file content
	console.log("new slice");
	res = yield axios.get(`http://${upload_server_ip}/gupload/new_slice`, { params: { upload_token } });

	if (res.status !== 200) {
		throw new Error("new slice failed!");
	}

	let fd = yield fsopen(info.file_name, "r");

	var slice = res.data;
	do {
		console.log("upload slice", slice);
		let buf = Buffer.alloc(slice.length);
		yield fsread(fd, buf, 0, slice.length, slice.offset);
		res = yield axios.post(`http://${upload_server_ip}/gupload/upload_slice`, buf, {
			params: {
				upload_token,
				slice_task_id: slice.slice_task_id,
				offset: slice.offset,
				length: slice.length,
				hash: crypto
					.createHash("md5")
					.update(buf)
					.digest("hex")
			}
		});

		if (res.status !== 201) {
			throw new Error("upload slice failed!", slice.slice_task_id);
		}
		slice = res.data;
	} while (slice.offset !== 0);

	// wait until done
	do {
		// check status
		console.log("check status...");
		res = yield axios.get(`http://${upload_server_ip}/gupload/check`, { params: { upload_token } });

		if (res.status !== 200) {
			throw new Error("check status failed!");
		}
		console.log(res.data);
		if (res.data.status === 4) {
			throw new Error("upload is not complete, cannot commit!");
		}
		if (res.data.status === 1) {
			break;
		}
		yield cb => setTimeout(cb, 5000);
	} while (true);

	// commit
	console.log("commit upload");
	res = yield axios.post(
		"https://api.youku.com/uploads/commit.json",
		querystring.stringify({
			access_token: info.access_token,
			client_id: info.client_id,
			upload_token,
			upload_server_ip
		})
	);

	if (res.status !== 200) {
		throw new Error("commit upload failed!");
	}

	return res.data.video_id;
});
