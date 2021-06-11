<template>
	<div id="setting" class="setting">
		<div class="head">
			<a id="setting-config" class="on">Configuration</a>
			<a v-show="admin" id="setting-email">Email content</a>
			<a v-show="admin" id="setting-process">Process</a>
			<a v-show="admin" id="setting-welcome">Welcome words</a>
		</div>
		<div class="content">
			<div id="setting-config" class="content-main on">
				<ul class="setting">
					<li v-show="admin">
						<label>Debug Mode</label>
						<input type="hidden" id="set-debug" v-model="config.debug" />
						<div :class="['radio', config.debug ? 'on' : '']">
							<span @click="config.debug = !config.debug"></span>
						</div>
					</li>
					<li>
						<label>Remote</label>
						<input type="hidden" id="set-debug" v-model="config.remote" />
						<div :class="['radio', config.remote ? 'on' : '']">
							<span @click="config.remote = !config.remote"></span>
						</div>
					</li>
					<li>
						<label>Folder of Stage Config</label>
						<input class="max" id="set-theme" value v-model="config.theme" />
					</li>
					<li v-show="admin">
						<label>Creator API address</label>
						<input class="max" id="set-theme" value v-model="config.creatorApi" />
					</li>
					<li>
						<label>Place to save data</label>
						<input class="max" id="set-theme" value v-model="config.storage" />
					</li>
					<hr />

					<h2>Ai Config</h2>
					<li>
						<label>use</label>
						<!--            <el-switch v-model="aiConfig.use"></el-switch>-->
						<div :class="['radio', aiConfig.use ? 'on' : '']">
							<span @click="aiConfig.use = !aiConfig.use"></span>
						</div>
					</li>
					<li>
						<label>debug</label>
						<!--            <el-switch v-model="aiConfig.debug"></el-switch>-->
						<div :class="['radio', aiConfig.debug ? 'on' : '']">
							<span @click="aiConfig.debug = !aiConfig.debug"></span>
						</div>
					</li>

					<h2>Devices</h2>
					<li>
						<label>Audio Device</label>
						<select class="max" v-model="config.device.audioDeviceId">
							<option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">{{
								device.label
							}}</option>
						</select>
					</li>
					<li>
						<label>Video Device</label>
						<select class="max" v-model="config.device.videoDeviceId">
							<option v-for="device in videoDevices" :value="device.deviceId" :key="device.deviceId">{{
								device.label
							}}</option>
						</select>
					</li>

					<h2>Display Config</h2>
					<li>
						<label>Display Mode</label>
						<select class="max" v-model="zconfig.DisplayMode.Display3D" @change="changeZConfig">
							<option
								v-for="(ratio, index) in [
									['0', 'No 3D Display'],
									['1', '3D SBS Display'],
									['2', '3D Anaglyph Display']
								]"
								:value="ratio[0]"
								:key="index"
								>{{ ratio[1] }}</option
							>
						</select>
					</li>
					<li>
						<label>Focal Z Distcan</label>
						<input
							class="max"
							id="Focal_Z_Distcan"
							@change="changeZConfig"
							value
							v-model="zconfig.DisplayMode.stereoDepthZ"
						/>
					</li>
					<li>
						<label>Interocular distance</label>
						<input
							class="max"
							id="Interocular_distance"
							@change="changeZConfig"
							value
							v-model="zconfig.DisplayMode.stereoIOD"
						/>
					</li>
					<li>
						<label>Text offset</label>
						<input
							class="max"
							id="Text_offset"
							@change="changeZConfig"
							value
							v-model="zconfig.DisplayMode.offsetText"
						/>
					</li>

					<h2>Command line setting</h2>
					<li>
						<label>Set CommandFolder</label>
						<input class="max" id="Text_offset1" @change="save" value v-model="config.commandFolder" />
					</li>

					<hr v-show="admin" />

					<h2 v-show="admin">Send info to internet</h2>
					<li v-show="admin">
						<label>Photo</label>
						<input type="hidden" id="set-photo" value="false" v-model="config.online.photo" />
						<div :class="['radio', config.online.photo ? 'on' : '']">
							<span @click="config.online.photo = !config.online.photo"></span>
						</div>
					</li>
					<li v-show="admin">
						<multiselect
							v-model="photoMode"
							:multiple="true"
							:disabled="!config.online.photo"
							placeholder
							:options="['Upload to MyAR', 'Email to user']"
						></multiselect>
					</li>
					<li v-show="admin">
						<label>Video</label>
						<input type="hidden" id="set-video" value="true" v-model="config.online.video" />
						<div :class="['radio', config.online.video ? 'on' : '']">
							<span @click="config.online.video = !config.online.video"></span>
						</div>
					</li>
					<li v-show="admin">
						<multiselect
							v-model="videoMode"
							:multiple="true"
							:disabled="!config.online.video"
							placeholder
							:options="['Upload to MyAR', 'Email to user']"
						></multiselect>
					</li>
					<li v-show="admin">
						<label>Video hosting</label>
						<select class="max" v-model="config.email.video.mode" :disabled="!config.online.video">
							<option value="youku">Youku</option>
							<option value="vimeo">Vimeo</option>
							<option value="none">None</option>
						</select>
					</li>
					<hr v-show="admin" />

					<li v-show="admin">
						<label>MP4 Conversion</label>
						<input type="hidden" id="set-ffmpeg" value="true" v-model="config.email.video.ffmpeg" />
						<div :class="['radio', config.email.video.ffmpeg ? 'on' : '']">
							<span @click="config.email.video.ffmpeg = !config.email.video.ffmpeg"></span>
						</div>
					</li>
					<li v-show="admin">
						<label>Background Music</label>
						<input class="max" id="set-music" value v-model="config.email.video.music" />
					</li>
					<li v-show="admin">
						<label>Voice after conversion</label>
						<select class="max" id="voice" v-model="config.email.video.voiceMode">
							<option value="Background music only" selected>Background music only</option>
							<option value="Original voice only">Original voice only</option>
							<option value="Retain both">Retain both</option>
						</select>
					</li>
					<li v-show="admin">
						<label>Size</label>
						<select class="max" id="set-size" v-model="config.email.video.size">
							<option value="1920*1080" selected>1920 * 1080</option>
							<option value="1280*720">1280 * 720</option>
						</select>
					</li>
					<h2 v-show="admin">Video Format</h2>
					<li v-show="admin">
						<label>Codec</label>
						<select class="max" id="set-codec" v-model="config.capture.codecs">
							<option value="vp8" selected>vp8</option>
							<option value="vp9">vp9</option>
							<option value="h264">h264</option>
						</select>
					</li>
					<li v-show="admin">
						<label>Video Bitrate</label>
						<select class="max" id="set-vbitrate" v-model="config.capture.videoBitrate">
							<option value="2500000">2500000</option>
							<option value="3000000">3000000</option>
							<option value="5000000">5000000</option>
							<option value="8000000" selected>8000000</option>
						</select>
					</li>
					<li v-show="admin">
						<label>Audio Bitrate</label>
						<select class="max" id="set-abitrate" v-model="config.capture.audioBitrate">
							<option value="128000" selected>128000</option>
							<option value="192000">192000</option>
						</select>
					</li>
					<li v-show="admin">
						<label>Frame Rate</label>
						<input class="max" v-model="config.capture.frameRate" />
					</li>
					<li v-show="admin">
						<label>Size</label>
						<select class="max" v-model="config.capture.size">
							<option value="1920*1080" selected>1920*1080</option>
							<option value="1280*720">1280*720</option>
							<option value="640*480">640*480</option>
							<option value="320*240">320*240</option>
						</select>
					</li>
					<hr v-show="admin" />

					<h2 v-show="admin">System Email Setup</h2>
					<li v-show="admin">
						<label>Restart time</label>
						<input class="min" id="set-restart" value v-model="config.email.email.restart" />
						<span>seconds</span>
					</li>
					<li v-show="admin">
						<label>Delay</label>
						<input class="min" id="set-delay" value v-model="config.email.email.delay" />
						<span>seconds</span>
					</li>
					<li v-show="admin">
						<label>System email service provider</label>
						<input class="max" id="set-email-service" value v-model="config.email.email.service" />
					</li>
					<li v-show="admin">
						<label>Username</label>
						<input class="max" id="set-email-username" value v-model="config.email.email.username" />
					</li>
					<li v-show="admin">
						<label>Password</label>
						<input class="max" id="set-email-password" value v-model="config.email.email.password" />
					</li>
					<li v-show="admin">
						<label>Port</label>
						<input class="min" id="set-email-port" value v-model="config.email.email.port" />
					</li>
					<li v-show="admin">
						<label>Secure connection</label>
						<input type="hidden" id="set-secure" value="true" v-model="config.email.email.secureConnection" />
						<div :class="['radio', config.email.email.secureConnection ? 'on' : '']">
							<span @click="config.email.email.secureConnection = !config.email.email.secureConnection"></span>
						</div>
					</li>
					<li v-show="admin">
						<label>Reply to</label>
						<input class="max" id="set-email-replyto" value v-model="config.email.email.replyTo" />
					</li>
					<hr v-show="admin" />

					<h2 v-show="admin">Admin panel</h2>
					<li v-show="admin">
						<label>Password to log in</label>
						<input class="max" id="set-email-password-login" value v-model="config.password" />
					</li>
					<hr v-show="admin" />

					<h2 v-show="admin">Vimeo setup</h2>
					<li v-show="admin">
						<label>App ID</label>
						<input class="max" id="set-vimeo-id" value v-model="config.email.vimeo.appid" />
					</li>
					<li v-show="admin">
						<label>App Secrete key</label>
						<input class="max" id="set-vimeo-key" value v-model="config.email.vimeo.appsecret" />
					</li>
					<li v-show="admin">
						<label>Token</label>
						<input class="max" id="set-vimeo-token" value v-model="config.email.vimeo.token" />
					</li>

					<h2 v-show="admin">Youku setup</h2>
					<li v-show="admin">
						<label>Client ID</label>
						<input class="max" id="set-youku-client-id" value v-model="config.email.youku.client_id" />
					</li>
					<li v-show="admin">
						<label>Client Secret</label>
						<input class="max" id="set-youku-client-secret" value v-model="config.email.youku.client_secret" />
					</li>
					<li v-show="admin">
						<label>Access Token</label>
						<input class="max" id="set-youku-access-token" value v-model="config.email.youku.access_token" />
					</li>
					<li v-show="admin">
						<label>Refresh Token</label>
						<input class="max" id="set-youku-refresh-token" value v-model="config.email.youku.refresh_token" />
					</li>

					<hr v-show="admin" />

					<h2 v-show="admin">IntegemCam setup</h2>

					<li v-show="admin">
						<label>HDRatio</label>
						<select class="max" v-model="HDRatio" @change="setHDRatio">
							<option v-for="(ratio, index) in ['1', '2', '3']" :value="ratio" :key="index">{{ ratio }}</option>
						</select>
					</li>
				</ul>
				<div class="foot">
					<el-button type="text" @click="more">MORE SETTING</el-button>
					<router-link to="/">
						<button class="cancel">Exit</button>
					</router-link>
					<button class="save" @click="save">Save</button>
				</div>
			</div>
			<div id="setting-email" class="content-main">
				<form id="Emailfile" hidden="hidden">
					<input type="file" id="cFile" name="inputFile" value="choose file" accept=".csv" />
				</form>
				<ul class="setting">
					<li>
						<label>Email For Photo:</label>
						<textarea class="max" id="set-photo-txt" v-model="photoTemplate"></textarea>
					</li>
					<li>
						<label>Email For Video</label>
						<textarea class="max" id="set-video-txt" v-model="videoTemplate"></textarea>
					</li>
					<li>
						<label>Email For Field</label>
						<button @click="sendEmail">send</button>
						<textarea class="max" id="set-video-txt" v-model="fieldTemplate"></textarea>
					</li>
				</ul>

				<div class="foot">
					<router-link to="/">
						<button class="cancel">Exit</button>
					</router-link>
					<button class="save" @click="save">Save</button>
				</div>
			</div>
			<div id="setting-process" class="content-main">
				<!-- select a dateTime's emails to process -->
				<div class="mid">
					<ul class="list">
						<li>
							<h3>Process Based On Dates</h3>
							<div class="selector">
								<select name="date" id="dateSelect">
									<option value="-1">choose a date</option>

									<option v-for="(dateTime, key) in reverseExistDate" :key="key" :value="dateTime">{{
										dateTime
									}}</option>
								</select>

								<div v-for="(userEmail, key) in existEmail" :key="key">
									<input type="checkbox" :value="userEmail" name="emailAccount" />
									<label for="emailAccount">{{ userEmail }}</label>
								</div>

								<button v-if="existEmail.length" @click="selectProcess" :disabled="processing">
									{{ processing ? "Processing..." : "select process" }}
								</button>
								<button v-if="existEmail.length" @click="initProcess" :disabled="initializing">
									{{ initializing ? "Initializing..." : "select initialize" }}
								</button>
							</div>
						</li>

						<li>
							<h3>Process Based On Emails</h3>
							<!-- select a user's dateTimes to process -->
							<div class="selector">
								<select name="user" id="emailsSelect">
									<option value="-1">choose a email</option>

									<option v-for="(useremail, key) in allEmails" :key="key" :value="useremail">{{ useremail }}</option>
								</select>

								<div v-for="(emailDate, key) in reverseEmailDates" :key="key">
									<input type="checkbox" :value="emailDate" name="emailDate" />
									<label for="emailDate">{{ emailDate }}</label>
								</div>

								<button v-if="emailDates.length" @click="selectDateProcess" :disabled="processing">
									{{ processing ? "Processing..." : "select process" }}
								</button>
								<button v-if="emailDates.length" @click="initDateProcess" :disabled="initializing">
									{{ initializing ? "Initializing..." : "select initialize" }}
								</button>
							</div>
						</li>

						<li>
							<h3>Process Based On All Day</h3>
							<!-- refresh date -->
							<div class="selector">
								<select name="date" id="freshDate">
									<option value="-1">choose a date</option>

									<option v-for="(dateTime, key) in reverseExistDate" :key="key" :value="dateTime">{{
										dateTime
									}}</option>
								</select>

								<button @click="freshDate">refresh date in db force</button>
							</div>
						</li>

						<li>
							<h3>Process All Data</h3>
							<button class="process" @click="process" :disabled="processing">
								{{ processing ? "Processing..." : "Process" }}
							</button>
						</li>

						<li>
							<h3>Process to creator</h3>
							<div class="selector">
								<input class="input" v-model="creator_path" />
								<select v-model="creator_mode">
									<option value="1">Only mp4</option>
									<option value="2">Upload to vimeo</option>
									<option value="3">Upload to creator</option>
								</select>
							</div>
							<button class="process" @click="processCreator" :disabled="processing">
								{{ processing ? "Processing..." : "Process" }}
							</button>
							<ul v-if="creatorFiles.length > 0">
								<li v-for="file in creatorFiles" :key="file.id">
									{{ file.file }} <a target="_blank" :href="file.open">Open</a>
								</li>
							</ul>
							<!-- <div v-if="creatorFiles.length > 0" v-for="file in creatorFiles" :key="file.id">{{file.file}} <a target="_blank" :href="file.open">Open</a></div> -->
						</li>

						<li>
							<h3>Export users to CVS</h3>
							<button class="process" @click="csv">Export</button>
						</li>
					</ul>
				</div>
			</div>

			<div id="setting-welcome" class="content-main">
				<ul class="setting">
					<li>
						<label>Words For Welcome:</label>
						<textarea class="max" v-model="welcomeWords"></textarea>
					</li>
				</ul>

				<div class="foot">
					<router-link to="/">
						<button class="cancel">Exit</button>
					</router-link>
					<button class="save" @click="saveWelcome">Save</button>
				</div>
			</div>
		</div>

		<div class="alertBox" v-if="alertBox.show">
			<div>{{ alertBox.text }}</div>
		</div>
	</div>
</template>

<script>
import Multiselect from "vue-multiselect";
import { saveAs } from "file-saver";

const os = require("os");

export default {
	name: "Settings",
	components: {
		Multiselect
	},
	data() {
		return {
			socket: io("/login"),
			HDRatio: 1,
			creator_path: "",
			creator_mode: 3,
			processing: false,
			initializing: false,
			videoTemplate: "",
			photoTemplate: "",
			fieldTemplate: "",
			welcomeWords: "",
			photoMode: null,
			videoMode: null,
			audioDevices: [],
			videoDevices: [],
			selector: {},
			existDate: [],
			existEmail: [],
			users: [],
			all: [],
			allEmails: [],
			emailDates: [],
			alertBox: {
				timerId: null,
				text: "",
				show: false
			},
			aiConfig: {
				poses: {
					flipHorizontal: false,
					maxDetections: 5,
					scoreThreshold: 0.5,
					nmsRadius: 20,
					decodingMethod: "single-person"
				},
				use: false,
				show: 0.5,
				debug: false,
				main: {
					architecture: "MobileNetV1",
					outputStride: 16,
					inputResolution: 500,
					multiplier: 0.75,
					quantBytes: 2
				}
			},
			config: {
				commandFolder: "",
				debug: true,
				storage: "",
				password: "",
				device: {
					audioDeviceId: "",
					videoDeviceId: ""
				},
				online: {
					photo: false,
					video: false
				},
				capture: {
					codecs: "vp8",
					videoBitrate: 3000000,
					audioBitrate: 128000
				},
				email: {
					photo: {
						upload: true,
						email: true
					},
					video: {
						mode: "none",
						music: "",
						ffmpeg: false,
						size: "1920*1080",
						upload: false,
						email: false,
						voiceMode: "Background music only"
					},
					email: {
						restart: 3,
						delay: 2.718,
						service: "",
						username: "",
						password: "",
						port: 587,
						secureConnection: true,
						replyTo: ""
					},
					vimeo: {
						appid: "",
						appsecret: "",
						token: ""
					},
					youku: {
						client_id: "",
						client_secret: "",
						access_token: "",
						refresh_token: ""
					}
				},
				theme: ""
			},
			password: "integem",
			admin: false,
			creatorFiles: [],
			zconfig: {
				HDResolutionRatio: {
					HDratio: 1
				},
				DisplayMode: {
					Display3D: 0,
					stereoDepthZ: 25,
					stereoIOD: 0.1
				}
			}
		};
	},
	watch: {
		aiConfig: {
			handler: function(v) {
				console.log(v);
				this.socket.emit("aiConfigSet", v);
			},
			deep: true
		}
	},
	methods: {
		setHDRatio() {
			// console.log(v, this.HDRatio)
			this.socket.emit("setHDRatio", this.HDRatio);
		},
		changeZConfig() {
			this.socket.emit("setZConfig", this.zconfig);
		},
		more() {
			this.$prompt("Please input password", "Prompt", {
				confirmButtonText: "Login",
				cancelButtonText: "Cancel",
				inputType: "password"
				// inputPattern: /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,
				// inputErrorMessage: '邮箱格式不正确'
			})
				.then(({ value }) => {
					this.admin = value === this.password;
					if (value === this.password) {
						this.$message({
							type: "success",
							message: "Landed successfully!"
						});
					} else {
						this.$message({
							type: "error",
							message: "Login failed!"
						});
					}
				})
				.catch(e => {
					this.$message({
						type: "warn",
						message: e.message
					});
				});
		},
		csv() {
			let users = JSON.parse(JSON.stringify(this.users));
			users.unshift({
				name: "Name",
				email: "Email"
			});
			var blob = new Blob(
				[
					users
						.map(user => [user.name, user.email])
						.map(user => user.join(","))
						.join("\r")
				],
				{ type: "text/plain;charset=utf-8" }
			);
			saveAs(blob, "Users.csv");
		},
		alert(txt) {
			this.alertBox.text = txt;
			let show = this.alertBox.show;
			if (show) clearTimeout(this.alertBox.timerId);

			this.alertBox.show = true;
			this.alertBox.timerId = setTimeout(() => {
				this.alertBox.show = false;
			}, 3000);
		},
		save() {
			console.log("Save configuration");

			this.config.email.photo.upload = this.photoMode.indexOf("Upload to MyAR") >= 0;
			this.config.email.photo.email = this.photoMode.indexOf("Email to user") >= 0;
			this.config.email.video.upload = this.videoMode.indexOf("Upload to MyAR") >= 0;
			this.config.email.video.email = this.videoMode.indexOf("Email to user") >= 0;

			this.socket.emit("configSet", {
				config: this.config,
				photo: this.photoTemplate,
				video: this.videoTemplate
			});

			this.socket.emit("fieldSet", this.fieldTemplate);

			this.alert("Setting is saved successfully!");
		},
		saveWelcome() {
			this.socket.emit("welcomeSet", this.welcomeWords, () => {
				alert("modify success");
			});
		},
		sendEmail() {
			document.getElementById("Emailfile").reset();
			$("#cFile").off("change");
			$("#cFile").click();
			$("#cFile").on("change", () => {
				var IsSend = confirm("Are you sure send email for " + $("#cFile").val());
				if (!IsSend) return;

				$.ajax({
					url: "/uploadEmailFile",
					type: "POST",
					cache: false,
					data: new FormData($("#Emailfile")[0]),
					processData: false,
					contentType: false
				})
					.done(filePath => {
						this.socket.emit("emailFile", { filePath: filePath }, (err, info) => {
							if (!err) alert("Finished");
							else alert(err);
						});
					})
					.fail(function(e) {
						alert(e);
					});
			});
		},
		selectProcess() {
			if (!$('input[name="emailAccount"]:checked').length || $("#dateSelect").val() == "-1") {
				alert("please select Email");
				return;
			}

			var tempEmails = [];
			$('input[name="emailAccount"]:checked').each(function() {
				tempEmails.push($(this).val());
			});

			var info = {};
			info.dateTime = $("#dateSelect").val();
			info.email = tempEmails;

			this.processing = true;
			this.socket.emit("selectProcess", info, (err, data) => {
				// alert("Process over")
			});
		},
		initProcess() {
			if (!$('input[name="emailAccount"]:checked').length || $("#dateSelect").val() == "-1") {
				alert("please select Email");
				return;
			}

			var tempEmails = [];
			$('input[name="emailAccount"]:checked').each(function() {
				tempEmails.push($(this).val());
			});

			var info = {};
			info.dateTime = $("#dateSelect").val();
			info.email = tempEmails;

			this.initializing = true;
			this.socket.emit("setProjectInit", info, err => {
				// alert("Process over")
				if (!err) this.initializing = false;
				else console.error(err);
			});
		},
		selectDateProcess() {
			if (!$('input[name="emailDate"]:checked').length || $("#emailsSelect").val() == "-1") {
				alert("please select date");
				return;
			}

			var tempDates = [];
			$('input[name="emailDate"]:checked').each(function() {
				tempDates.push($(this).val());
			});

			var info = {};
			info.email = $("#emailsSelect").val();
			info.dateTimes = tempDates;

			this.processing = true;

			this.socket.emit("selectDateProcess", info, (err, data) => {
				// alert("Process over")
			});
		},
		initDateProcess() {
			if (!$('input[name="emailDate"]:checked').length || $("#emailsSelect").val() == "-1") {
				alert("please select date");
				return;
			}

			var tempDates = [];
			$('input[name="emailDate"]:checked').each(function() {
				tempDates.push($(this).val());
			});

			var info = {};
			info.email = $("#emailsSelect").val();
			info.dateTimes = tempDates;

			this.initializing = true;
			console.log(`init data...`);
			this.socket.emit("setProjectInit", info, err => {
				// alert("Process over")
				if (!err) this.initializing = false;
				else console.error(err);
			});
		},
		process() {
			this.processing = true;

			this.socket.emit("processData", err => {
				if (err) {
					// Only one reason to go here:
					//  It is already processing.
					console.error(err);
				}
			});
		},
		processCreator() {
			this.processing = true;
			console.log("processCreator starting...");

			// console.log({path: this.creator_path, mode: parseInt(this.creator_mode)})
			this.socket.emit("processCreator", { path: this.creator_path, mode: parseInt(this.creator_mode) }, files => {
				console.log(files);
				this.creatorFiles = files;
			});
		},
		freshDate() {
			this.socket.emit("forceRefresh", $("#freshDate").val(), (err, data) => {
				alert("fresh over");
			});
		}
	},
	mounted() {
		this.socket.emit("getHDRatio", HDRatio => {
			this.HDRatio = HDRatio;
		});

		this.socket.emit("getZConfig", config => {
			if (!config.DisplayMode.offsetText) {
				config.DisplayMode.offsetText = 0;
			}
			this.zconfig = config;
		});

		// Initial tabs
		$("#setting div.head a").click(function() {
			$("#setting div.head a").removeClass("on");
			var id = $(this).attr("id");
			$(this).addClass("on");
			$("#setting div.content")
				.children("div")
				.removeClass("on");
			$("#setting div.content div#" + id).addClass("on");
		});

		this.socket.emit("getDevices", (err, devices) => {
			if (err) {
				return console.error(err);
			}
			console.log(devices);
			this.audioDevices = devices.filter(d => d.kind === "audioinput");
			this.videoDevices = devices.filter(d => d.kind === "videoinput");
		});

		// Load configuration
		this.socket.emit("configGet", (err, data) => {
			if (err) {
				return console.error(err);
			}
			this.config = data.config;
			this.photoTemplate = data.photo;
			this.videoTemplate = data.video;

			this.photoMode = [];
			if (this.config.email.photo.upload) {
				this.photoMode.push("Upload to MyAR");
			}
			if (this.config.email.photo.email) {
				this.photoMode.push("Email to user");
			}

			this.videoMode = [];
			if (this.config.email.video.upload) {
				this.videoMode.push("Upload to MyAR");
			}
			if (this.config.email.video.email) {
				this.videoMode.push("Email to user");
			}
		});

		this.socket.emit("getAiConfig", (err, data) => {
			if (!err) this.aiConfig = data;
		});

		this.socket.on("serverState", state => {
			console.log("Server state:", state);
			if (state.processorState) {
				this.processing = state.processorState !== "idle";
			}
		});

		this.socket.on("console", data => {
			console.log(data);
		});

		this.socket.emit("welcomeGet", (err, data) => {
			if (!err) this.welcomeWords = data;
		});

		this.socket.emit("fieldGet", (err, data) => {
			if (!err) this.fieldTemplate = data;
		});

		this.socket.emit("getDateTime", null, (err, dateTime) => {
			if (!err) {
				this.existDate = dateTime;
				// console.log(dateTime);
			} else console.log(err);
		});

		let that = this;
		$("#dateSelect").change(function() {
			if ($(this).val() == "-1") return;
			//从文件夹中找到存在的email文件夹 将email显示出来
			that.socket.emit("filterUser", $(this).val(), (err, emails) => {
				if (!err) {
					//   console.log(emails);
					that.existEmail = emails;
				} else console.log(err);
			});
		});

		this.socket.emit("getEmails", (err, data) => {
			if (!err) this.allEmails = data;
			else console.error(err);
		});

		this.socket.emit("getAll", (err, data) => {
			if (!err) this.all = data;
			else console.error(err);
			console.log("all", this.all);
		});

		this.socket.emit("getUsers", (err, data) => {
			if (!err) {
				this.users = data;
				console.log(data);
			} else {
				console.error(err);
			}
		});

		$("#emailsSelect").change(function() {
			if ($(this).val() == "-1") return;
			//get the date for email selected
			that.socket.emit("getDateTimesforEmail", $(this).val(), (err, data) => {
				if (!err) {
					that.emailDates = data;
				} else console.error(err);
			});
		});
	},
	computed: {
		reverseExistDate() {
			return this.existDate.concat().sort(function(a, b) {
				return b - a;
			});
		},
		reverseEmailDates() {
			return this.emailDates.concat().sort(function(a, b) {
				return b - a;
			});
		}
	},
	destroyed() {
		if (this.socket) {
			this.socket.close();
		}
	}
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style>
.multiselect__tag {
	background-color: rgb(119, 172, 34);
}
</style>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div.setting div.content div.content-main div.mid {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	max-width: 500px;
	height: auto;
	margin: auto;
	padding: 30px;
}

div.alertBox {
	position: fixed;
	top: 10px;
	left: 10px;
	right: 10px;
	text-align: center;
}

div.alertBox > div {
	display: inline-block;
	background: rgb(119, 172, 34);
	border: 1px solid green;
	color: #fff;
	padding: 10px;
	border-radius: 3px;
}

ul.list li {
	border: rgb(242, 242, 242) solid 1px;
	margin-bottom: 20px;
	padding: 20px;
}

ul.list li h3 {
	margin-bottom: 20px;
}

ul.list li div.selector select,
ul.list li div.selector input.input {
	width: 100%;
	padding: 10px;
	margin-bottom: 10px;
}

ul.list li div.selector div {
	margin-bottom: 10px;
}

ul.list li div.selector button {
	margin-bottom: 10px;
}

ul.list li div.selector button:last-child {
	margin-bottom: 0;
}

div.list {
	padding: 5px 0;
	border-top: 1px solid #ccc;
}

div.list:first-child {
	border: none;
}
</style>
