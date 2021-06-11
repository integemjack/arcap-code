<template>
    <div id="scenes" class="login">
        <div class="logo">
            <img src="/image/logo.png"/>
            <div class="btns">
                <a @click="$router.push({path: '/photos'})">
                    <img src="/image/image.png" title="Your Images"/>
                </a>
                <popover ref="volumepopover" placement="bottom" trigger="click">
                    <div style="width:300px">
                        <img @click="toggleVolume" :src="'/image/'+(volume?'volume.png':'mute.png')" width="36px"
                             height="36px" style="float:left"/>
                        <slider v-model="volume" @change="onVolumeChange"
                                style="width:230px; position:relative; left:50px"></slider>
                    </div>
                </popover>
                <div v-popover:volumepopover class="volume" style="display: inline-block; position: unset;">
                    <img :src="volumeImage"/>
                </div>
                <a @click="toggleLight">
                    <img v-if="light" src="/image/light-off.png"/>
                    <img v-if="!light" src="/image/light-on.png"/>
                </a>
                <a @click="toggleRecordAll">
                    <img v-if="recordAll" src="/image/recordAll-on.png"/>
                    <img v-if="!recordAll" src="/image/recordAll-off.png"/>
                </a>
            </div>
        </div>
        <div class="admin">
            <div>
                <a :href="`${domain}#/themes?from=2012`" style="margin-right: 5px;">
                    <img src="/image/themes.png" title="Themes"/>
                </a>
                <a href="javascript:void(0);" @click="logout">
                    <img src="/image/logout.png" title="Logout"/>
                </a>
                <a :href="domain" target="_blank">
                    <img src="/image/admin.png"/>
                </a>
                <a @click="$router.push({path: '/setting'})">
                    <img src="/image/settings.png"/>
                </a>
            </div>
            <div>
                <input placeholder="Search" v-model="keyword"/>
                <img class="i" src="/image/search.png"/>
            </div>
            <div class="sort">
                <img @click="useBarCodeClick" style="padding: 5px;" src="/image/barcode.png"/>
                <img @click="sortAble=!sortAble" src="/image/createtask_fill.png"/>
                <ul v-if="sortAble">
                    <h1>Tags</h1>
                    <li v-for="tag in tags" :key="tag.id" @click="tag.use=!tag.use"><input type="checkbox"
                                                                                           v-model="tag.use"/>{{tag.value}}
                    </li>
                </ul>
            </div>

        </div>

        <div v-if="this.$root.$data.scenes.length === 0" style="width: 100%; text-align: center">
            No themes found,
            <a target="_blank" :href="domain">Add</a> one now!
        </div>

        <!--<div class="tags">-->
        <!--<label v-for="tag in tags" :key="tag.id" :class="{'on': tag.use}"><input type="checkbox" v-model="tag.use">{{tag.value}}</label>-->
        <!--</div>-->
        <!--        <div>-->
        <!--            <el-button @click="useBarCodeClick">Bar Code</el-button>-->
        <!--        </div>-->

        <div v-if="useBarCode" class="barcode" style="margin-bottom: 30px;">
            <div :class="[{right: barcode}, 'barcode']">
                <video id="preview" style="width: 100%; position: absolute;"></video>
            </div>
            <br/>
        </div>

        <ul class="wrapper">
            <li class="box" v-for="s in themesFilter" :key="s.id" @click="start(s)">
                <!--<router-link :to="{ path: '/start', query: { theme: s.id, name: '', email: '', autostart: true } }">-->
                <!--                <router-link to="#">-->
                <p>
                    <img :src="`/themes/${s.id}/cover`" style="width: 100%; vertical-align: bottom;">
                    <span class="ratio">
                            HDRatio:<span v-for="(ratio, index) in s.HDRatio" :key="index">{{ratio}}</span>
                        </span>
                </p>
                <div class="title">{{ s.name }}</div>

                <!--                </router-link>-->
            </li>
        </ul>

        <div class="pages">
            <!--<button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1" @click="page=1">&lt;&lt;-->
            <!--</button>-->
            <button :class="{'no': page<=1, 'on': true, 'to': true}" :disabled="page<=1" @click="page=page-1">&lt;
            </button>

            <button :class="{'on': page===p}" v-for="p in pages" :key="p" :disabled="page===p" @click="page=p">{{p}}
            </button>

            <button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages" @click="page=page+1">
                &gt;
            </button>
            <!--<button :class="{'no': page>=pages, 'on': true, 'to': true}" :disabled="page>=pages" @click="page=pages">-->
            <!--&gt;&gt;-->
            <!--</button>-->
        </div>
    </div>
</template>

<script>
	import axios from "axios";
	import { Popover, Slider } from "element-ui";
	import { BrowserBarcodeReader } from "@zxing/library";

	const codeReader = new BrowserBarcodeReader();

	function IsPC() {
		let userAgentInfo = navigator.userAgent;
		let Agents = ["Android", "iPhone",
			"SymbianOS", "Windows Phone",
			"iPad", "iPod"];
		let flag = true;
		for (let v = 0; v < Agents.length; v++) {
			if (userAgentInfo.indexOf(Agents[v]) > 0) {
				flag = false;
				break;
			}
		}
		return flag;
	}

	export default {
		name: "Scenes",
		components: { Popover, Slider },
		data: function() {
			return {
				socket: io("/login"),
				sortAble: false,
				keyword: "",
				light: true,
				page: 1,
				pageNumber: 18,
				pages: 1,
				allUse: true,
				tags: [],
				themes: [],
				volume: 50,
				volumeImage: "/image/volume.png",
				// domain: "",
				recordAll: true,
				barcode: IsPC(),
				useBarCode: false
			};
		},
		watch: {
			tags: {
				handler: function(v) {
					this.themes = this.$root.$data.scenes.filter(t => this.inArray(JSON.parse(t.tag), v));
					this.pages = Math.ceil(this.themes.length / this.pageNumber);
					this.page = 1;
				},
				deep: true
			},
			volume: function(v) {
				this.volumeImage = v !== 0 ? "/image/volume.png" : "/image/mute.png";
			}
		},
		methods: {
			useBarCodeClick() {
				this.useBarCode = !this.useBarCode;
				if (this.useBarCode) {
					codeReader
						.decodeFromInputVideoDevice(undefined, "preview")
						.then(result => {
							// this.theme.barcode = result.text;
							console.log(result);
							this.socket.emit("log", this.themes.filter(t => {
								this.socket.emit("log", t.barcode);
								return t.barcode === result.text * 1;
							}));
							this.socket.emit("log", result.text);
							this.start(this.themes.filter(t => t.barcode === result.text * 1)[0]);
						})
						.catch(err => {
							console.error(err);
							this.socket.emit("log", err.message);
						});

					let myvObj = document.getElementById("preview");
					myvObj.addEventListener("loadedmetadata", function() {
						console.log(myvObj.offsetHeight);
						myvObj.style.top = `${0 - myvObj.offsetHeight / 2}px`;
					});
				} else {
					codeReader.stopAsyncDecode();
				}
			},
			start(theme) {
				let ex = false;
				for (let i = 0; i < theme.HDRatio.length; i++) {
					console.log(theme.HDRatio[i], theme.HDResolutionRatio, theme.HDRatio[i] === theme.HDResolutionRatio);
					if (theme.HDRatio[i] === theme.HDResolutionRatio) ex = true;
				}
				if (ex) {
					this.$router.push({ path: "/start", query: { theme: theme.id, autostart: true } });
				} else {
					this.$message.error(`The system HD ratio is ${theme.HDResolutionRatio}, But HD ratio for this project is ${theme.HDRatio.join(",")}, which is not fit for system setting. Please go to iCreator to generate the related project.`);
				}
				// console.log(theme.HDResolutionRatio.toString(), theme.HDRatio, theme.HDRatio.indexOf(theme.HDResolutionRatio.toString()))
				return false;

			},
			inArray: function(obj, tags) {
				let result = false;
				obj.forEach(tag => {
					tags.forEach(v => {
						if (v.use && v.value === tag) {
							result = true;
						}
					});
				});
				return result;
			},
			logout() {
				localStorage.removeItem("lastUser");
				localStorage.removeItem("userInfo");
				// this.$router.push({ path: "/login" });
				location.href = "/";
			},
			toggleLight() {
				this.socket.emit("toggleLight");
			},
			toggleRecordAll() {
				this.socket.emit("toggleRecordAll");
			},
			toggleVolume() {
				if (this.volume === 0) {
					this.volume = 100;
				} else {
					this.volume = 0;
				}
				this.onVolumeChange();
			},
			onVolumeChange() {
				this.socket.emit("volume", this.volume);
			}
		},
		computed: {
			themesFilter: function() {
				let themes = this.themes.filter(v => new RegExp(this.keyword, "gi").test(v.name));
				console.log(themes.length, themes.length / this.pageNumber);
				this.pages = Math.ceil(themes.length / this.pageNumber);
				return themes.filter((v, i) => i >= (this.page - 1) * this.pageNumber && i < this.page * this.pageNumber);
			},
			domain: function() {
				return "https://" + document.domain + ":2018/";
			}
		},
		created() {

			axios
				.get("/themes")
				.then(response => {
					console.log(response.data);
					this.themes = this.$root.$data.scenes = response.data;
					this.pages = Math.ceil(this.themes.length / this.pageNumber);
					this.page = 1;
				})
				.catch(e => {
					console.error(e);
				});
			axios
				.get("/tags")
				.then(response => {
					this.tags = response.data;
				})
				.catch(e => {
					console.error(e);
				});
		},
		mounted() {
			// 是否登陆
			if (localStorage.getItem("lastUser")) {
				try {
					JSON.parse(localStorage.getItem("lastUser"));
				} catch (e) {
					localStorage.removeItem("lastUser");
					localStorage.removeItem("userInfo");
					this.$router.push({ path: "/login" });
				}
			} else {
				this.$router.push({ path: "/login" });
			}

			this.socket.on("serverState", state => {
				console.log("Server state:", state);
				if (state.arState && state.arState.light) {
					if (state.arState.light === "on") {
						this.light = true;
					} else if (state.arState.light === "off") {
						this.light = false;
					}
				}

				if (state.arState && state.arState.recordAll) {
					console.log(state.arState.recordAll, state.arState.recordAll === "on");
					this.recordAll = state.arState.recordAll === "on";
				}

				if (state.arState && state.arState.volume !== undefined) {
					this.volume = state.arState.volume;
				}
			});
		},
		destroyed() {
			if (this.socket) {
				this.socket.close();
			}
		}
	};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style src="element-ui/lib/theme-chalk/index.css"></style>
<style scoped>
    br {
        clear: both;
    }

    .barcode {
        width: 100%;
        height: 240px;
        overflow: hidden;
        position: relative;
    }

    .barcode.right {
        width: 50%;
        float: right;
    }

    div.tags {
        padding: 10px 10px 0 10px;
        background: RGB(242, 242, 242);
        border-radius: 3px;
        margin-bottom: 20px;
    }

    div.tags label {
        background: RGB(230, 230, 230);
        margin-right: 10px;
        border-radius: 3px;
        padding: 5px 10px;
        display: inline-block;
        color: #333;
        margin-bottom: 10px;
    }

    div.tags label.on {
        background: #4898f8;
        color: #fff;
    }

    div.tags label input {
        margin-right: 5px;
    }

    div#scenes ul {
        max-width: 100%;
    }

    .wrapper {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-gap: 15px;
        background-color: #fff;
        color: #444;
        margin: auto;
    }

    .box {
        background: white;
        text-decoration: none;
        color: #444;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;

        border-radius: 5px;
        font-size: 150%;

        cursor: pointer;
    }

    .box p {
        position: relative;
    }

    .box .title {
        font-size: 16px;
        color: #333;
        padding: 10px 5px;
    }

    .ratio {
        position: absolute;
        left: 5px;
        bottom: 5px;
        color: #ccc;
        font-weight: bold;
        font-size: 14px;
    }

    .ratio span {
        color: #FFF;
        font-weight: bold;
        font-size: 14px;
        /*background: RGBA(0, 0, 0, 0.8);*/
        text-shadow: 0 0 3px #333;
        margin-left: 5px;
    }

    div.pages {
        text-align: center;
    }

    div.pages button {
        display: inline-block;
        background: #fff;
        border-radius: 20px;
        padding: 5px;
        color: #333;
        margin: 5px;
        border: 3px solid #fff;
        cursor: pointer;
        font-size: 16px;
        line-height: 15px;
        height: 30px;
        min-width: 30px;
        text-align: center;
    }

    div.pages button.on {
        border: 3px solid #4898f8;
        cursor: auto;
    }

    div.pages button.on.to {
        border: 3px solid #fff;
        cursor: pointer;
    }

    div.pages button.no {
        border: 3px solid #fff;
        color: #ccc;
        cursor: auto;
    }

    @media (max-width: 600px) {
        .wrapper {
            grid-template-columns: unset;
        }
    }
</style>
