<template>
    <div id="main" class="main" style="padding: 150px 10px 0 10px;">
        <div class="logo">
            <a href="#" @click="home">
                <img src="/image/logo.png"/>
            </a>
        </div>
        <button class="mode" @click="list = !list">
            <img v-if="!list" src="/image/list.png"/>
            <img v-if="list" src="/image/thumbnail.png"/>
        </button>

        <button class="mode choose">
            <img src="/image/choose.png"/>
            <ul>
                <li>
                    <input id="0" type="checkbox" v-model="allUse"/>
                    <label @click="allUse=!allUse">Select All</label>
                </li>
                <hr/>
                <li v-for="tag of tags" :key="tag.id">
                    <input :id="tag.id" type="checkbox" v-model="tag.use"/>
                    <label @click="tag.use=!tag.use">{{tag.value}}</label>
                </li>
            </ul>
        </button>

        <table v-if="list">
            <thead>
            <tr>
                <th>
                    <input @change="handleAllChoose" type="checkbox" v-model="allChoose"/>
                </th>
                <th>ID</th>
                <th>Bar Code</th>
                <th>Name</th>
                <th>Tag</th>
                <th>Location</th>
                <th>Thumbnail</th>
                <th>Management(delete/edit)</th>
                <th>Description</th>
            </tr>
            </thead>
            <draggable
                    v-if="themesFilter.length > 0"
                    v-model="themesFilter"
                    :element="'tbody'"
                    @end="onDragEnd"
            >
                <tr v-for="theme of themesFilter.filter(t => !t.del)" :key="theme.id">
                    <td>
                        <input type="checkbox" v-model="theme.choose" :value="theme.id"/>
                    </td>
                    <td>{{theme.id}}</td>
                    <td>{{theme.barcode}}</td>
                    <td>{{theme.name}}</td>
                    <td>{{theme.tag | tagsFilter}}</td>
                    <td>{{theme.location | om}}</td>
                    <td>{{theme.thumbnail | om}}</td>
                    <td>
                        <a class="btn" @click="delBox(theme.id, theme, theme.name)">Delete</a>
                        /
                        <a class="btn" @click="edit(theme.id)">Edit</a>
                        /
                        <a class="btn" @click="open(theme.location)">Open</a>
                    </td>
                    <td>{{theme.description}}</td>
                </tr>
            </draggable>
            <tbody v-if="themesFilter.filter(t => !t.del).length === 0">
            <tr>
                <td colspan="8" style="text-align: center;">No themes, create one now.</td>
            </tr>
            </tbody>
        </table>

        <div class="themes">
            <ul class="themes" v-if="!list">
                <li v-for="theme of themesFilter.filter(t => !t.del)" :key="theme.id">
                    <div>
                        <a class="btn del" @click="delBox(theme.id, theme, theme.name)">X</a>
                        <a class="btn" @click="edit(theme.id)"><img :src="theme.thumbnail | image"
                                                                    :title="theme.description"/></a>
                        <p><a class="btn" @click="edit(theme.id)">{{theme.name}}</a></p>
                    </div>
                </li>
                <li class="no" v-if="themesFilter.filter(t => !t.del).length === 0">No themes, create one now.</li>
                <br/>
            </ul>

            <router-link v-if="!is2012" to="/">
                <button class="command">BACK</button>
            </router-link>

            <router-link to="/themes/add">
                <button class="command">ADD</button>
            </router-link>

            <a>
                <button @click="themes_export">EXPORT</button>
            </a>

            <a>
                <div style="display: none">
                    <input id="upload" type="file" @change="themes_import" accept=".csv"/>
                </div>
                <button @click="import_btn">IMPORT</button>
            </a>

            <a>
                <button @click="group_del">DELETE</button>
            </a>
        </div>

        <div v-if="del.show" class="delBox">
            <h1>Delete</h1>
            <a class="close" @click="del.show=false">X</a>
            <div class="com">
                <img src="/image/alert.png"/> Delete
                <span>{{del.name}}</span>
            </div>
            <div class="footer">
                <button @click="del.show=false">Cancel</button>
                <button @click="_del(del.id, del.index)">OK</button>
            </div>
        </div>
        <div v-if="del.show" class="delBoxBackground" @click="del.show=false"></div>

        <div v-if="dels.show" class="delBox">
            <h1>Delete</h1>
            <a class="close" @click="dels.show=false">X</a>
            <div class="com">
                <img src="/image/alert.png"/> Delete
                <span>{{dels.name}}</span>
            </div>
            <div class="footer">
                <button @click="dels.show=false">Cancel</button>
                <button @click="_dels()">OK</button>
            </div>
        </div>
        <div v-if="dels.show" class="delBoxBackground" @click="dels.show=false"></div>

        <model title="IMPORT THEME" :visible="modelprops.visible">
            <div>The theme with {{statement}} exists, do you want to replace it?</div>
            <template slot="footer">
                <button v-if="this.new.status" @click="handleAsNew" class="btn">AsNewTheme</button>
                <button @click="checkImportQueue" class="btn">Skip</button>
                <button @click="handleReplace" class="btn btn-primary">Replace</button>
            </template>
        </model>
    </div>
</template>

<script>
	import path from "path";
	import draggable from "vuedraggable";
	import model from "./model.vue";

	import { saveAs } from "file-saver";
	import async from "async";

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
		name: "Themes",
		components: {
			draggable,
			model
		},
		data: function() {
			return {
				themesFilter: [],
				themes: [],
				list: IsPC(),
				del: {
					show: false,
					name: "",
					id: -1,
					index: {}
				},
				dels: {
					show: false,
					name: "",
					id: -1,
					index: -1
				},
				modelprops: {
					visible: false,
					title: ""
				},
				tags: [],
				allUse: true,
				allChoose: false,
				importQueue: [],
				new: {
					theme: "",
					status: ""
				},
				statement: ""
			};
		},
		watch: {
			tags: {
				handler: function(val, oldVal) {
					console.log("Update theme list");
					let none = false;
					if (oldVal.length != 0) {
						val.forEach(tag => {
							if (tag.value === "none") {
								none = tag.use;
							} else {
								this.$http.post("/tags/update", { tag });
							}
						});
					}
					this.themesFilter.splice(0, this.themesFilter.length);
					this.themes.forEach(theme => {
						if (/^\.[\/\\]?/i.test(theme.thumbnail)) {
							theme.thumbnail = path.join(theme.location, theme.thumbnail.split(/^\.[\/\\]?/)[1]);
						}
						if (none && theme.tag.length === 0) this.themesFilter.push(theme);
						if (this.inArray(theme.tag)) this.themesFilter.push(theme);
						else {
							theme.choose = false;
						}
					});
				},
				deep: true
			},
			allUse: {
				handler: function(v) {
					this.tags.forEach(tag => {
						if (tag.value !== "none") tag.use = v;
					});
				},
				deep: true
			},
			themesFilter: {
				handler: function(val, oldVal) {
					let countChoose = 0;
					val.forEach(theme => {
						if (theme.choose) {
							countChoose++;
						}
					});
					if (countChoose == val.length) {
						this.allChoose = true;
					} else {
						this.allChoose = false;
					}
				},
				deep: true
			}
		},
		methods: {
			group_del() {
				this.dels = {
					show: true,
					name: this.themesFilter.filter(t => t.choose).map(t => t.name).join(", ")
				};
			},
			is2012() {
				return localStorage.getItem("from") && localStorage.getItem("from") === "2012";
			},
			themes_export: function() {
				let f = [];
				let themes = this.themes.filter(theme => theme.choose).map(theme => {
					let t = [];
					f = [];
					for (let k in theme) {
						if (k === "tag") theme[k] = theme[k].join("|");
						t.push(theme[k]);
						f.push(k);
					}
					return t;
				});
				themes.unshift(f);
				let blob = new Blob([themes.map(theme => theme.join(",")).join("\r")], {
					type: "text/plain;charset=utf-8"
				});
				saveAs(blob, "themes.csv");
			},
			import_btn: function() {
				let upload = document.getElementById("upload");
				upload.click();
			},
			themes_import: function(e) {
				const file = e.target.files[0];
				const reader = new FileReader();
				reader.onload = e => {
					console.log(e.target.result);
					let txt = e.target.result;
					let arrays = txt.split("\r").map(t => t.split(","));
					let f = arrays.shift();
					arrays.forEach(theme => {
						let _theme = {};
						theme.forEach((v, i) => {
							if (f[i] === "tag") {
								_theme[f[i]] = v.split("|");
							} else {
								_theme[f[i]] = v;
							}
						});

						let flag = false;
						let status;
						for (let i = 0; i < this.themes.length; i++) {
							if (this.themes[i].location == _theme.location) {
								status = 0;
								flag = true;
								break;
							} else if (this.themes[i].name == _theme.name) {
								status = 1;
								flag = true;
							}
						}

						if (!flag) {
							this.addTheme(_theme);
						} else {
							this.importQueue.push({
								theme: _theme,
								status
							});
						}
					});
					this.checkImportQueue();
					// location.reload(true);
				};
				reader.readAsText(file);
			},
			_dels() {
				async.eachSeries(this.themesFilter.filter(t => t.choose).sort((a, b) => {
					return b.id - a.id;
				}), (theme, cb) => {
					console.log(theme.id);
					this.$http
						.post("/themes/del", { id: theme.id })
						.then(res => {
							console.log(res);
							if (!res.data.success) return;
							// this.themes.splice(index, 1);
							theme.del = true;
							cb();
							// for (let i = 0; i < this.themesFilter.length; i++) {
							//   if (this.themesFilter[i].id === id) {
							//     this.themesFilter.splice(i, 1);
							//     cb();
							//     break;
							//   }
							// }
						})
						.catch(cb);
				}, err => {
					console.log(err);
					this.dels = {
						show: false,
						name: "",
						id: -1,
						index: -1
					};
				});
			},
			_del: function(id, index) {
				console.log(id, index);
				this.$http
					.post("/themes/del", { id })
					.then(res => {
						console.log(res);
						if (!res.data.success) return;
						this.del = {
							show: false,
							name: "",
							id: -1,
							index: -1
						};
						index.del = true;
						// this.themes.splice(index, 1);
						// for (let i = 0; i < this.themesFilter.length; i++) {
						//   if (this.themesFilter[i].id === id) {
						//     this.themesFilter.splice(i, 1);
						//     break;
						//   }
						// }
					})
					.catch(console.error);
			},
			addTheme(theme) {
				this.$http
					.post("/theme", { theme: theme })
					.then(res => {
						this.themes.push(theme);
						this.themesFilter.push(theme);
						theme.tag.forEach(v => {
							let flag = true;
							this.tags.forEach(tag => {
								if (v == tag.value) {
									flag = false;
								}
							});
							if (flag) {
								this.$http.post("/tags/insert", { tag: v }).then(res => {
									this.$http.post("/tags").then(res => {
										this.tags = res.data.result;
									});
								});
							}
						});
					})
					.catch(err => {
						console.log(err);
					});
			},
			delBox: function(id, index, name) {
				this.del = {
					show: true,
					name: name,
					id: id,
					index: index
				};
			},
			edit: function(id) {
				this.$router.push({ name: "addTheme", query: { id: id } });
			},
			inArray: function(tags) {
				let result = false;
				tags.forEach(tag => {
					this.tags.forEach(v => {
						if (v.use && v.value === tag) {
							result = true;
						}
					});
				});
				return result;
			},
			onDragEnd() {
				console.log("On drag end.", this.themesFilter.map(t => t.name));
				this.themesFilter.forEach((v, i) => {
					v.sort = this.themesFilter.length - i;
				});
				this.$http.post("/theme/sort", {
					themes: this.themesFilter
				});
			},
			handleAllChoose(e) {
				this.themesFilter.forEach(theme => {
					theme.choose = this.allChoose;
				});
			},
			handleReplace() {
				let index;
				let newTheme = this.new.theme;
				let themes = this.themes;
				for (let i = 0; i < themes.length; i++) {
					if (themes[i].location == newTheme.location) {
						index = i;
						break;
					} else if (themes[i].id == newTheme.id) {
						index = i;
					}
				}
				for (let key in newTheme) {
					if (key == "id") continue;
					themes[index][key] = newTheme[key];
				}
				this.$http
					.post("/theme/edit", { id: themes[index].id, theme: themes[index] })
					.then(res => {
						themes[index].tag.forEach(v => {
							let flag = true;
							this.tags.forEach(tag => {
								if (v == tag.value) {
									flag = false;
								}
							});
							if (flag) {
								this.$http.post("/tags/insert", { tag: v }).then(res => {
									this.$http.post("/tags").then(res => {
										this.tags = res.data.result;
									});
								});
							}
						});
						this.checkImportQueue();
					})
					.catch(e => {
						console.log(e);
					});
			},
			handleAsNew() {
				let theme = this.new.theme;
				let max = 0;
				this.themes.forEach(theme => {
					max = max > theme.id ? max : theme.id;
				});
				theme.id = max - 0 + 1;
				theme.name = `${theme.name}的副本`;
				this.addTheme(theme);
				this.checkImportQueue();
			},
			checkImportQueue() {
				if (this.importQueue.length > 0) {
					this.modelprops.visible = true;
					this.new = this.importQueue.shift();
					if (this.new.status) {
						this.statement = `name ${this.new.theme.name}`;
					} else {
						this.statement = `location ${this.new.theme.location}`;
					}
				} else {
					this.modelprops.visible = false;
				}
			},
			home() {
				if (localStorage.getItem("from") && localStorage.getItem("from") === "2012") {
					location.href = this.domain;
				} else {
					location.href = `/`;
				}
			},
			open(location) {
				console.log(location);
				this.$http.post("/theme/open", { location }).then(console.log).catch(e => {
					this.$message({ message: e.message, type: "error" });
				});
			}
		},
		computed: {
			domain: function() {
				return "https://" + document.domain + ":2012/";
			}
		},
		filters: {
			image: function(value) {
				return `/image/?url=${encodeURI(value)}`;
			},
			om: function(value) {
				let _array = value.split("\\");
				return _array[_array.length - 1];
			},
			tagsFilter: function(value) {
				return value.join(",");
			}
		},
		mounted: function() {

			// 是否是从2012过来
			if (this.$route.query.from && this.$route.query.from === "2012") {
				// location.href = `https://localhost:2012`;
				localStorage.setItem("from", "2012");
				this.$router.push({ path: "/themes" });
			} else {
				// location.href = `/`;
			}

			this.$http.post("/themes").then(res => {
				this.themes = res.data.result.map(theme => {
					theme.choose = false;
					return theme;
				});
				this.$http.post("/tags").then(res => {
					this.tags = res.data.result;
					this.tags.push({
						use: false,
						value: "none"
					});
				});
			});
		}
	};
</script>

<style scoped>
    div.themes {
        max-width: 1000px;
        margin: auto;
        padding: 10px;
    }

    a.btn {
        cursor: pointer;
    }

    table {
        width: 100%;
        border: 1px solid #4898f8;
        border-collapse: collapse;
        margin-bottom: 30px;
    }

    table thead {
        background: #4898f8;
        color: #fff;
    }

    table tr {
        padding: 5px 0;
    }

    table td,
    table th {
        line-height: 30px;
        text-align: center;
    }

    table th {
        border-left: 1px #fff solid;
    }

    table th:first-child {
        border-left: 0 #fff solid;
    }

    table td > img {
        vertical-align: middle;
        width: 39px;
        height: 39px;
    }

    table tr {
        border-bottom: 1px solid #4898f8;
    }

    table tr:last-child {
        border-bottom: 0 solid #4898f8;
    }

    ul.themes {
        margin-bottom: 30px;
    }

    ul.themes li {
        float: left;
        width: 50%;
        text-align: center;
    }

    ul.themes li.no {
        clear: both;
        width: 100%;
        display: block;
        text-align: center;
    }

    ul.themes li div {
        position: relative;
        padding: 10px;
    }

    ul.themes li div img {
        width: 100%;
        min-width: 100%;
        background: #999999;
    }

    ul.themes li div a.del {
        position: absolute;
        right: 0;
        top: 0;
        width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        background: red;
        color: #fff;
        border-radius: 50%;
    }

    div.themes a {
        margin: auto;
        max-width: 600px;
        display: block;
        margin-bottom: 20px;
    }

    button.mode {
        position: absolute;
        top: 40px;
        right: 30px;
        width: 48px;
        height: 48px;
        background: none;
        color: #666666;
        outline: none;
        z-index: 2;
    }

    button.mode.choose {
        right: 108px;
    }

    button.mode.choose ul {
        display: none;
        min-width: 100px;
        min-height: 100px;
        background: #f5f5f5;
        border-radius: 3px;
        box-shadow: 0 0 5px #ccc;
    }

    button.mode.choose:hover ul {
        display: block;
    }

    button.mode.choose ul li {
        line-height: 20px;
        vertical-align: middle;
        text-align: left;
        padding: 0 5px;
        white-space: nowrap;
    }

    button.mode.choose ul li input {
        margin-right: 5px;
    }

    button.mode.choose ul li label {
        font-size: 12px;
        font-weight: normal;
        vertical-align: middle;
        display: inline-block;
    }

    br {
        clear: both;
    }

    div.delBox {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        max-width: 600px;
        max-height: 200px;
        background: #fff;
        z-index: 3;
        margin: auto;
        border-radius: 5px;
        padding: 10px;
    }

    div.delBox h1 {
        font-size: 24px;
        margin-bottom: 30px;
    }

    div.delBox a.close {
        position: absolute;
        top: 10px;
        right: 10px;
    }

    div.delBox div.com {
        line-height: 60px;
    }

    div.delBox div.com img {
        float: left;
        width: 60px;
        height: 60px;
        margin-right: 10px;
    }

    div.delBox div.footer {
        position: absolute;
        bottom: 10px;
        left: 10px;
        right: 10px;
        text-align: right;
    }

    div.delBox div.footer button {
        font-size: 16px;
        padding: 10px;
        height: auto;
        width: auto;
        font-weight: normal;
        background: #4898f8;
        border: 1px #4898f8 solid;
    }

    div.delBox div.footer button:first-child {
        background: #fff;
        border: 1px #ccc solid;
        color: #333;
    }

    div.delBoxBackground {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: RGBA(0, 0, 0, 0.7);
        z-index: 2;
    }
</style>
