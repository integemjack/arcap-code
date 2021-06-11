<template>
    <div id="main" class="main" style="padding: 150px 0 0 0;">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>

        <form method='post' enctype='multipart/form-data' id="fileForm">
            <input type="file" id="chooseFile" name="inputFile" value="choose file" accept=".csv"/>
            <input type="submit" id="submitFile" value="upload new file">
        </form>

        <div class="operations">
            <div id="chooseButton" @click="chooseFile">{{chooseFileName}}</div>
            <div id="uploadFile" @click="uploadFile" v-if="IsChoose">upload</div>
            <div id="addFile" @click="addFile" v-if="IsChoose">Add</div>
            <div id="sendEmail" @click="sendSelectEmails">send email</div>
            <div id="deleteUsers" @click="deleteSelect">delete users</div>
            <div id="saveAs" @click="saveSelect">save as csv</div>
            <div id="registe" @click="registUser">registe user</div>
        </div>
        <table class="list">
            <thead>
            <tr v-if="firstRow[0]">
                <th>
                    <input id="allCheck" type="checkbox" @click="toggleAllCheck"/>
                </th>
                <th v-for="(Prop,key) in firstRow" :key="key">
                    {{Prop}}
                </th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            <user v-for="(user, index) of users" v-if="user" :key="index" :user="user" :Props="DBProps" @edit="editUser(index)"
                  @del="delUser(index)"></user>
            </tbody>
        </table>

        <div v-if="editBox.show" class="login alert">
            <button @click="editBox.show = false">X</button>
            <div class="logo">
                <router-link to="/">
                    <img src="/image/logo.png"/>
                </router-link>
            </div>
            <ul>
                <li v-for="(Prop,key) of DBProps" :key="key">
                    <label>{{Prop}} </label>
                    <input type="text" v-model="editBox.user[Prop]"/>
                </li>
                <li class="button">
                    <button class="command" id="video" @click="finishEdit">SAVE</button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
	import user from "./models/user.vue";

	export default {
		name: "Settings",
		components: {
			user
		},
		data () {
			return {
				socket: io("/QRcode"),
				users: [],
				firstRow: [],
				IsChoose: false,
				chooseFileName: "Choose File",
				DBProps: [],
				editBox: {
					show: false,
					user: {},
					index: 0
				}
			};
		},
		mounted () {
			$("#fileForm").hide();
			if (!localStorage.getItem("admin") || localStorage.getItem("admin") !== "1") this.$router.push({
				name: "Admin"
			});
			// Load users  first row带 加上去的 eid 和 qrImage等
			this.socket.emit("usersGet", (err, data) => {
				if (err) {
					return console.error(err);
				}
				this.users = data;
				for (var i in data[0]) {
					//here put the don't show prop
					// if (i != "createdAt" && i != "updatedAt")
					this.firstRow.push(i);
				}
			});
			//load DB 的字段值
			this.socket.emit("getProps", (err, Props) => {

				if (err) console.log(err);
				else this.DBProps = Props;

			});

		},
		methods: {

			editUser (index) {
				this.editBox.user = JSON.parse(JSON.stringify(this.users[index]));
				this.editBox.index = index;
				this.editBox.show = true;
				console.log(this.editBox);
			},

			delUser (index) {
				this.users.splice(index, 1);
			},

			finishEdit () {
				this.socket.emit("updateOne", this.editBox.user, err => {
					if (err) console.log(err);
					else {
						alert("modify " + this.editBox.user.id + " successfully");
						this.editBox.show = false;
						this.users[this.editBox.index] = this.editBox.user;
						console.log(this.users[this.editBox.index], this.editBox.user);
					}
				});
			},

			toggleAllCheck () {

				if ($("#allCheck")[0].checked) {
					$("tbody input[type=checkbox]").each(function() {
						$(this).attr("checked", true);
					});
				} else {
					$("tbody input[type=checkbox]").each(function() {
						$(this).attr("checked", false);
					});
				}

			},
			saveSelect () {
				//传id给socket,client得到路由的query 然后用后端向前端发文件
				if (!$("tbody input[type=checkbox]:checked").length) {
					alert("You need select user first");
					return;
				}

				let Indexs = [];
				$("tbody input[type=checkbox]:checked").each((i, e) => {
					var oneData = e.parentNode.parentNode; //一条userData
					Indexs.push(parseInt(e.value));
				});

				this.socket.emit("saveSelect", Indexs, (err, query) => {
					if (err) console.log(err);
					else {
						window.open("/downloadCsv?id=" + query);
					}
				});

			},

			addFile () {

				if (!$("#chooseFile").val()) {
					alert("You need choose file first");
					return;
				}

				let fileName = $("#chooseFile").val();
				let Type = fileName.split(".");
				Type = Type[Type.length - 1];

				if (Type != "csv") {
					alert("CSV is only suported at present,you'd better upload again!");
					return;
				}

				let that = this;
				let IsAdd = confirm("Are you sure Add ' " + $("#chooseFile").val() + " ' ?");
				if (IsAdd) {
					// $("#fileForm").attr("action", "/addFile");
					// until this line, csv file get successfully in the font end
					$.ajax({
						url: "/uploadFile",
						type: "POST",
						cache: false,
						data: new FormData($("#fileForm")[0]),
						processData: false,
						contentType: false
					}).done(function(filePath) { //
						that.socket.emit("addFile", filePath, (err, data) => {
							if (!err) {
								that.users = that.users.concat(data);
								alert("Add file to dataBase success");
								that.IsChoose = false;
								document.getElementById("fileForm").reset();
								that.chooseFileName = "Choose File";
							} else if (err == -1) {
								alert("You need submit the same types with dataBase attributes");
							} else {
								console.log(err);
							}
						});
					}).fail(function(err) {
						console.log(err);
					});
				}
			},
			chooseFile () {
				$("#chooseFile").click();
				$("#chooseFile").one("change", () => {
					this.chooseFileName = $("#chooseFile").val() || "Choose File";
					this.IsChoose = this.chooseFileName == "Choose File" ? false : true;
				});
			},
			getDBProps () {

				this.socket.emit("getProps", (err, Props) => {
					if (err) console.log(err);
					else this.DBProps = Props;

				});
			},
			uploadFile () {
				if (!$("#chooseFile").val()) {
					alert("You need choose file first");
					return;
				}

				let fileName = $("#chooseFile").val();
				let Type = fileName.split(".");
				Type = Type[Type.length - 1];

				if (Type != "csv") {
					alert("CSV is only suported at present,you'd better upload again!");
					return;
				}

				let that = this;
				let IsUpload = confirm("Are you sure upload ' " + $("#chooseFile").val() +
					" ' ? Your database will reset");
				if (IsUpload) {

					// until this line, csv file get successfully in the font end
					$.ajax({
						url: "/uploadFile",
						type: "POST",
						cache: false,
						data: new FormData($("#fileForm")[0]),
						processData: false,
						contentType: false
					}).done((filePath) => {
						that.socket.emit("uploadFile", filePath, (err, data) => {
							if (!err) {
								console.log(data);
								console.log("upload to dataBase success");
								let tempProps = [];
								// for( var i of Object.keys(data[0])){
								for (var i in data[0]) {
									// if (i != "createdAt" && i != "updatedAt")
									tempProps.push(i);
								}
								console.log(tempProps);
								that.users = data;
								that.firstRow = tempProps;
								that.getDBProps();
								that.IsChoose = false;
								document.getElementById("fileForm").reset();
								that.chooseFileName = "Choose File";
							} else {
								alert(err);
								console.log(err);
								document.getElementById("fileForm").reset();
								that.chooseFileName = "Choose File";
							}
						});
					}).fail(function(err) {
						console.log(err);
					});
				}
			},
			sendSelectEmails () {

				if (!$("tbody input[type=checkbox]:checked").length) {
					alert("You need select user first");
					return;
				}

				//find the index of email in the firstRow
				let EmailIndex = -1;
				for (var i = 0; i < this.firstRow.length; i++) {
					if (this.firstRow[i].trim().toLocaleLowerCase() == "email") {
						EmailIndex = i;
						break;
					}
				}

				if (EmailIndex == -1) {
					alert("Your dataBase don't have the email fields");
				}

				let Indexs = [];
				$("tbody input[type=checkbox]:checked").each((i, e) => {
					var oneData = e.parentNode.parentNode; //一条userData
					Indexs.push(parseInt(e.value));
				});

				this.socket.emit("sendSelectIds", Indexs, (err, data) => {
					if (err) console.log(err);
					else {
						alert("success send mail");
						console.log("success send email to " + data + " !");
					}
				});


			},
			registUser () {
				window.location.href = "/#/reg";
			},
			deleteSelect () {
				if (!$("tbody input[type=checkbox]:checked").length) {
					alert("You need select user first");
					return;
				}
				let IsDelete = confirm("Are you sure delete it?");
				if (!IsDelete) return;

				let Indexs = [];
				let elements = [];
				$("tbody input[type=checkbox]:checked").each((i, e) => {
					var oneData = e.parentNode.parentNode; //一条userData
					Indexs.push(parseInt(e.value));
					elements.push(oneData);
				});
				// line 4 in user.vue value should update
				if (Indexs.length) {
					this.socket.emit("deleteSelectIds", Indexs, (err, success) => {
						if (success) {
							// console.log("delete id in:" + Indexs.toString());
							elements.forEach(oneData => {
								oneData.parentNode.removeChild(oneData);
							});
						} else {
							console.log(err);
						}
					});
				}
			},

			save () {
				this.$router.push({
					name: "Index"
				});
			},
			cancel () {
				this.$router.push({
					name: "Index"
				});
			}
		},
		destroyed () {
			if (this.socket) {
				this.socket.close();
			}
		}
	};
</script>

<style>
    .operations {
        width: 100%;
        margin-bottom: 10px;
    }

    .operations div {
        font-size: 1.8em;
        background-color: #4898f8;
        border: none;
        display: inline-block;
        padding: 0 10px;
        color: #FFF;
        border-radius: 5px;
        margin-left: 10px;
        cursor: pointer;
    }

    table {
        width: 100%;
        border: 1px solid #4898F8;
        border-collapse: collapse;
    }

    table thead {
        background: #4898F8;
        color: #FFF;
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
        border-left: 1px #FFF solid;
    }

    table th:first-child {
        border-left: 0 #FFF solid;
    }

    table td > img {
        vertical-align: middle;
        width: 39px;
        height: 39px;
    }

    table tr {
        border-bottom: 1px solid #4898F8;
    }

    table tr:last-child {
        border-bottom: 0 solid #4898F8;
    }
</style>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    div.alert {
        padding: 100px 0 0 0;
        max-width: 500px;
        min-height: 500px;
        border: 1px solid #CCC;
        box-shadow: 0 0 5px #CCC;
        background: #FFF;
        /*border-radius: 15px;*/
    }

    div.login {
        margin: auto;
        position: absolute;
        top: 0;
        bottom: auto;
        left: 0;
        right: 0;
        padding: 200px 50px 50px 50px;
    }

    div.alert.login {
        max-width: 400px;
    }

    div.login ul li input {
        padding-left: 120px;
    }

    div.alert > button {
        position: absolute;
        top: 0;
        right: 0;
        width: 30px;
        height: 30px;
        background: #FFF;
        color: #333;
        text-align: center;
        border: 1px #FFF solid;
    }

    div.alert > div.content {
        position: unset;
        margin-bottom: 5px;
        padding: 0 30px;
    }

    div.alert > ul {
        padding: 40px 30px 0 30px;
    }

    div.alert > ul > li {
        margin-bottom: 20px;
    }
</style>