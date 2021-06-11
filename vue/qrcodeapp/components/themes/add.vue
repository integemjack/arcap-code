<template>
    <div id="main" class="main" style="padding: 150px 0px 0px;">
        <div class="header">
            <div class="logo">
                <a href="#" @click="home">
                    <img src="/image/logo.png">
                </a>
            </div>
            <div class="user">
                <div v-if="!user">
                    <img @click="userForm.visible = true" src="/image/user.png" alt>
                    <button @click="userForm.visible = true" class="btn-primary">Sign in</button>
                </div>
                <div v-else>
                    <img
                            src="https://secure.gravatar.com/avatar/51acc829500f2b65de601cfc1f39ded3?s=120&d=monsterid&r=g
"
                            alt
                    >
                    <button @click="signout" class="btn-primary">Sign out</button>
                </div>
            </div>
        </div>

        <ul>
            <h1>Add New AR Project</h1>
            <li>
                <label>Project Folder</label>
                <div>
                    <img v-if="downloadIcon" @click="addLink(true)" :disabled="filesFrom.loading" class="link" src="/image/download.png" alt="Download">
                    <input v-model="theme.location">
                </div>
            </li>
            <li v-if="useBarCode">
                <!--                <div style="width: 100%; height: 240px; overflow: hidden; position: relative;">-->
                <!--                    <video id="preview" style="width: 100%; position: absolute;"></video>-->
                <!--                </div>-->
                <video id="preview" playsInline style="width: 100%; background: #000;"></video>
            </li>
            <li>
                <label>Project Bar Code</label>
                <img class="link" @click="useBarCodeClick" src="/image/barcode.png"/>
                <input v-model="theme.barcode">
            </li>
            <li>
                <label>Project Name</label>
                <input v-model="theme.name">
            </li>
            <li>
                <label>Description</label>
                <input v-model="theme.description">
            </li>
            <li>
                <label>Thumbnail</label>
                <input v-model="theme.thumbnail">
            </li>
            <li>
                <label>Tag Name</label>
                <input v-model="theme.tag" readonly>
                <span class="btn tags" @click="tagBox.show=true">
          <img src="/image/tag_add.png"> Add Tags
        </span>
            </li>
            <li>
                <router-link :to="{name: 'Themes'}">
                    <button class="cancel">CANCEL</button>
                </router-link>
                <router-link
                        v-if="id===-1"
                        :to="{name: 'addThemeVerify', query: {theme: JSON.stringify(theme)}}"
                >
                    <button class="next">NEXT</button>
                </router-link>
                <a v-if="id!==-1">
                    <button class="save" @click="save">SAVE</button>
                </a>
                <br>
            </li>
        </ul>

        <div class="tagBox" v-if="tagBox.show">
            <h1>Choose Tags</h1>
            <a @click="tagBox.show=false" class="close">X</a>
            <input type="text" placeholder="Search or Add" v-model="tagBox.tagInput">
            <button class="add" @click="addTag">Add</button>
            <div class="tags">
        <span
                v-for="tag of tagBox.tags"
                :key="tag.id"
                :class="{'on': tag.on}"
                @click="tag.on=!tag.on"
        >{{tag.value}}</span>
            </div>
            <div class="footer">
                <button class="Anti" v-if="false" @click="tagBox.tags.forEach(tag=>tag.on=!tag.on)">Anti</button>
                <button class="del" @click="delTags">Delete</button>
                <button class="cancel" @click="tagBox.show=false">Cancel</button>
                <button class="ok" @click="chooseTags">OK</button>
            </div>
        </div>
        <Model :visible="linkForm.visible" title="insert/edit link">
            <div>
                <div>
                    <i>Enter the destination URL</i>
                </div>
                <div class="form-group">
                    <label class="text-addon" for>URL</label>
                    <input
                            v-model="linkForm.createUrl"
                            class="form-control"
                            type="text"
                            placeholder="https://player.integem.com/videos/a-visit-outer-space"
                    >
                </div>
            </div>
            <template slot="footer">
                <button @click="linkForm.visible = false" class="btn-default" :disabled="linkForm.do">Cancel</button>
                <button @click="addLink" class="btn-primary" :disabled="linkForm.do">Get theme</button>
            </template>
        </Model>
        <Model :visible="filesFrom.visible" title="choose zip file">
            <div>
                <div>
                    <i>Choose</i>
                </div>
                <select v-model="filesFrom.guid" style="padding: 5px; width: 100%; margin-bottom: 10px;">
                    <option
                            v-for="(file, index) in filesFrom.list"
                            :key="index"
                            :value="file.guid"
                    >{{file.guid}}
                    </option>
                </select>
                <el-progress :text-inside="true" :stroke-width="18" :percentage="filesFrom.bar"></el-progress>
            </div>
            <template slot="footer">
                <el-button
                        @click="filesFrom.visible = false"
                        class="btn-default"
                        :disabled="filesFrom.loading"
                >Cancel
                </el-button>
                <el-button @click="download" class="btn-primary" :disabled="filesFrom.loading">Download</el-button>
            </template>
        </Model>
        <Model :visible="userForm.visible" title="user signin">
            <div>
                <div class="form-group">
                    <label class="text-addon" for>Username</label>
                    <input
                            v-model="userForm.username"
                            class="form-control"
                            type="text"
                            placeholder="Username"
                    >
                </div>
                <div class="form-group">
                    <label class="text-addon" for>Password</label>
                    <input
                            v-model="userForm.password"
                            class="form-control"
                            type="password"
                            placeholder="Password"
                    >
                </div>
            </div>
            <template slot="footer">
                <button @click="userForm.visible = false" class="btn-default">Cancel</button>
                <button @click="signin" class="btn-primary">Sign in</button>
            </template>
        </Model>
    </div>
</template>

<script>
	import model from "./model.vue";
	import { BrowserBarcodeReader } from "@zxing/library";

	const codeReader = new BrowserBarcodeReader();

	export default {
		name: "add",
		components: {
			Model: model
		},
		props: {
			id: {
				type: Number,
				default: -1
			},
			theme: {
				type: String,
				default: "{\"name\":\"\",\"location\":\"\",\"description\":\"Content\",\"thumbnail\":\"./thumbnail/stage_0.jpg\",\"tag\":[]}"
			}
		},
		data: function() {
			return {
				useBarCode: false,
				socket: io("/QRcode"),
				tagBox: {
					show: false,
					tags: [],
					tagInput: ""
				},
				linkForm: {
					visible: false,
					createUrl: ""
				},
				userForm: {
					visible: false,
					username: "",
					password: ""
				},
				filesFrom: {
					loading: false,
					visible: false,
					list: [],
					guid: "",
					bar: 0
				},
				user: "",
				downloadIcon: false
			};
		},
        watch: {
			"theme.location": function(val) {
				if(/^https?:\/\//.test(val)) {
					this.linkForm.createUrl = val;
                }
				this.downloadIcon = /^https?:\/\//.test(val);
            }
        },
		computed: {
			domain: function() {
				return "https://" + document.domain + ":2012/";
			}
		},
		methods: {
			useBarCodeClick() {
				this.useBarCode = !this.useBarCode;
				if (this.useBarCode) {
					codeReader
						.decodeFromInputVideoDevice(undefined, "preview")
						.then(result => {
							this.theme.barcode = result.text;
							this.useBarCode = false;
							codeReader.stopAsyncDecode();
							console.log(result);
						})
						.catch(err => {
							console.error(err);
							this.socket.emit("log", err.message);
						});
				} else {
					codeReader.stopAsyncDecode();
				}
			},
			home() {
				if (localStorage.getItem("from") && localStorage.getItem("from") === "2012") {
					location.href = this.domain;
				} else {
					location.href = `/`;
				}
			},
			save: function() {
				this.$http
					.post("/theme/edit", {
						id: this.id,
						theme: this.theme
					})
					.then(res => {
						this.$router.push({
							name: "Themes"
						});
					})
					.catch(() => {
						this.$router.push({
							name: "Themes"
						});
					});
			},
			chooseTags: function() {
				this.theme.tag = [];
				this.tagBox.tags.forEach(v => {
					if (v.on) this.theme.tag.push(v.value);
				});
				this.tagBox.show = false;
			},
			delTags: function() {
				this.tagBox.tags.forEach((v, i) => {
					if (v.on) {
						this.$http
							.post("/tags/del", {
								id: v.id
							})
							.then(res => {
								if (res.data.result === 1) {
									this.tagBox.tags.splice(i, 1);
								}
							});
					}
				});
			},
			addTag: function() {
				this.$http
					.post("/tags/insert", {
						tag: this.tagBox.tagInput
					})
					.then(res => {
						console.log(res.data.result);
						this.tagBox.tags.push(res.data.result);
					});
			},
			signin: function() {
				this.$http
					.post("/user/signin", {
						username: this.userForm.username,
						password: this.userForm.password
					})
					.then(res => {
						if (res.status === 200 && res.data.success === true) {
							this.user = res.data.data;
							window.localStorage.setItem("user", JSON.stringify(res.data.data));
							this.userForm.visible = false;
							console.log(this.user);
						} else {
							alert(res.data.data);
						}
					});
			},
			signout: function() {
				window.localStorage.removeItem("user");
				this.user = "";
			},
			showLinkModal: function() {
				if (!this.user) {
					return alert("please signin");
				} else {
					this.linkForm.visible = true;
				}
			},
			addLink: function(auto = false) {
				if (this.linkForm.createUrl !== "") {
					this.linkForm.do = true;
					this.$http
						.post("/theme/addfromlink", {
							userId: this.user.ID,
							url: this.linkForm.createUrl
						})
						.then(res => {
							console.log(res.data);
							this.filesFrom.list = res.data.data;
							this.filesFrom.guid = res.data.data[0].guid;
							this.linkForm.visible = false;
							this.linkForm.do = false;
							this.filesFrom.visible = true;
							this.filesFrom.id = res.data.data[0].post_parent;
							// if (res.status === 200 && res.data.success === true) {
							//     this.theme = res.data.data;
							// }
                            if(auto) {
                            	this.download();
                            }
						});
				}
			},
			download: function() {
				this.filesFrom.loading = true;
				console.log(this.filesFrom.guid);
				this.socket.emit("downloadZip", this.filesFrom.guid, this.filesFrom.id, (err, data) => {
					console.log(err, data);
					this.theme = data;
					this.filesFrom.visible = false;
					this.filesFrom.loading = false;
					this.filesFrom.bar = 0;
				});
			}
		},
		created() {
			// codeReader
			//         .decodeFromInputVideoDevice(undefined, "preview")
			//         .then(result => {
			//           this.theme.barcode = result.text;
			//           console.log(result);
			//         })
			//         .catch(err => {
			//           console.error(err);
			//           this.socket.emit("log", err.message)
			//         });
		},
		mounted: function() {


			// codeReader
			//         .decodeFromInputVideoDevice(undefined, "preview")
			//         .then(result => {
			//           this.theme.barcode = result.text;
			//           console.log(result);
			//         })
			//         .catch(err => {
			//           console.error(err);
			//         });

			// let myvObj = document.getElementById("preview");
			// myvObj.addEventListener("loadedmetadata", function() {
			// 	console.log(myvObj.offsetHeight);
			// 	myvObj.style.top = `${0 - myvObj.offsetHeight / 2}px`;
			// });

			if (this.id !== -1) {
				this.$http.get(`/theme/${this.id}`).then(res => {
					this.theme = res.data.result;
					this.$http.post("/tags").then(res => {
						this.tagBox.tags = res.data.result;
						this.theme.tag.forEach(tag => {
							this.tagBox.tags.forEach(t => {
								if (t.value === tag) t.on = true;
							});
						});
					});
				});
			} else {
				this.theme = JSON.parse(this.theme);
				this.$http.post("/tags").then(res => {
					this.tagBox.tags = res.data.result;
				});
			}

			if (window.localStorage.getItem("user")) {
				let user = JSON.parse(window.localStorage.getItem("user"));
				this.user = user;
			}

			this.socket.on("progress", data => {
				console.log(data);
				this.filesFrom.bar = Math.round(data.percent * 100);
				console.log(this.filesFrom);
			});
		}
	};
</script>

<style scoped>
    /* @import url("//unpkg.com/element-ui/lib/theme-chalk/index.css"); */
    ul {
        padding: 10px;
        max-width: 800px;
        margin: auto;
    }

    ul h1 {
        margin-bottom: 30px;
        font-size: 46px;
        font-family: "Berlin Sans FB";
    }

    ul li {
        margin-bottom: 20px;
        position: relative;
    }

    ul li label {
        display: block;
        width: 100%;
        font-size: 20px;
        color: #666666;
        font-family: "Berlin Sans FB";
        margin-bottom: 10px;
    }

    ul li input {
        font-size: 24px;
        padding: 5px 0;
        border: none;
        border-bottom: 2px #ccc solid;
        display: block;
        width: 100%;
        outline: none;
    }

    ul li span.btn {
        position: absolute;
        bottom: 10px;
        right: 10px;
        line-height: 24px;
        /* border: 1px #ccc solid; */
        /* padding: 5px; */
        /* border-radius: 3px; */
        cursor: pointer;
    }

    ul li span.btn img {
        float: left;
        width: 24px;
        height: 24px;
        margin-right: 5px;
    }

    ul li a {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        float: left;
        width: 50%;
        padding: 10px;
    }

    ul li a button {
        border: 3px solid rgb(15, 117, 189);
    }

    ul li a:first-child button {
        background: #fff;
        color: rgb(15, 117, 189);
    }

    br {
        clear: both;
    }

    div.tagBox {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        max-width: 500px;
        height: 330px;
        margin: auto;
        background: #fff;
        border-radius: 3px;
        padding: 35px 5px 5px 5px;
        box-shadow: 0 0 5px #ccc;
    }

    div.tagBox h1 {
        position: absolute;
        top: 0;
        left: 5px;
        right: 30px;
        height: 30px;
        line-height: 30px;
        font-size: 20px;
    }

    div.tagBox a.close {
        position: absolute;
        top: 0;
        right: 0;
        width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;
    }

    div.tagBox input {
        margin-bottom: 10px;
        width: 100%;
        display: flex;
        padding: 10px;
        border: 1px green solid;
        border-radius: 3px;
    }

    div.tagBox button.add {
        display: inline-block;
        width: auto;
        height: auto;
        padding: 3px;
        font-size: 12px;
        position: absolute;
        top: 45px;
        right: 10px;
    }

    div.tagBox div.tags {
        border: 1px #ccc solid;
        height: 200px;
        overflow-y: auto;
        border-radius: 3px;
        overflow: hidden;
        padding: 5px;
    }

    div.tagBox div.tags span {
        margin: 5px;
        background: #ccc;
        color: #fff;
        padding: 5px 10px;
        border-radius: 3px;
        display: inline-block;
        cursor: pointer;
    }

    div.tagBox div.tags span.on {
        background: #4898f8;
    }

    div.tagBox div.footer {
        position: absolute;
        bottom: 5px;
        left: 5px;
        right: 5px;
        text-align: right;
    }

    div.tagBox div.footer button {
        display: inline-block;
        width: auto;
        height: auto;
        padding: 10px;
        font-size: 12px;
    }

    .el-button.is-disabled {
        background: #b4b4b4 !important;
    }

    div.tagBox div.footer button.cancel {
        background: red;
    }

    div.tagBox div.footer button.del {
        background: green;
    }

    img.link {
        position: absolute;
        right: 0;
        width: 24px;
        height: 24px;
        cursor: pointer;
    }

    button.btn-primary,
    button.btn-default {
        line-height: 1.5;
        display: inline-block;
        font-weight: 400;
        text-align: center;
        cursor: pointer;
        background-image: none;
        border: 1px solid transparent;
        white-space: nowrap;
        padding: 0 15px;
        font-size: 14px;
        border-radius: 4px;
        height: 32px;
        position: relative;
        color: rgba(0, 0, 0, 0.65);
        background-color: #fff;
        border-color: #d9d9d9;
        width: auto;
    }

    div.form-group {
        padding: 24px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    label.text-addon {
        padding: 0 12px;
    }

    input.form-control {
        font-family: "Chinese Quote", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
        "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
        "Segoe UI Symbol";
        font-variant: tabular-nums;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        list-style: none;
        position: relative;
        display: inline-block;
        padding: 4px 11px;
        width: 100%;
        height: 32px;
        font-size: 14px;
        line-height: 1.5;
        color: rgba(0, 0, 0, 0.65);
        background-color: #fff;
        background-image: none;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        -webkit-transition: all 0.3s;
        transition: all 0.3s;
    }

    div.header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    div.header div.user {
        position: absolute;
        top: 0;
        right: 50px;
        padding: 24px;
    }

    div.header div.user img {
        width: 64px;
        height: 64px;
        float: left;
    }

    div.user {
        display: flex;
        align-items: center;
    }

    div.user button {
        float: left;
        height: 64px;
        margin-left: 8px;
    }
</style>
