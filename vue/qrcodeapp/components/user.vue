<template>
    <tr>
        <td>
            <input type="checkbox" :value="user.id"/>
        </td>

        <td v-for="(userProp,key) in user" :key="key" v-if="key!='QRimage'">
            {{userProp}}
        </td>

        <td>
            <img @click="previewBox = true" :src="user['QRimage']"/>
            <div v-if="previewBox" class="main alert">
                <div class="logo">
                    <router-link to="/">
                        <img src="/image/logo.png"/>
                    </router-link>
                </div>
                <button @click="previewBox = false">X</button>
                <div class="content qrcode">
                    <img :src="user['QRimage']" class="qrcode"/>
                </div>
                <div class="content">
                    <button id="send" @click="send" :disabled="!emailShow">{{ !emailShow ? "Sending..." : "EMAIL" }}
                    </button>
                </div>
                <div class="content">
                    <button id="print" @click="print" :disabled="!printShow">{{ !printShow ? "Printing..." : "PRINT" }}
                    </button>
                </div>
                <div id="prints" v-show="false"></div>
            </div>
        </td>


        <td>
            <button @click="del">Delete</button>
            /
            <button @click="editBox = true">Edit</button>
            <div v-if="editBox" class="login alert">
                <button @click="editBox = false">X</button>
                <div class="logo">
                    <router-link to="/">
                        <img src="/image/logo.png"/>
                    </router-link>
                </div>
                <ul>
                    <li v-for="(Prop,key) of Props" :key="key">
                        <label>{{Prop}} </label>
                        <input type="text" v-model="user[Prop]"/>
                    </li>
                    <li class="button">
                        <button class="command" id="video" @click="finishEdit">SAVE</button>
                    </li>
                </ul>
            </div>
        </td>

    </tr>
</template>

<script>
    export default {
        name: "user",
        data() {
            return {
                socket: io("/QRcode"),
                previewBox: false,
                editBox: false,
                emailShow: true,
                printShow: true,
                editUser: {}
            };
        },
        props: {
            user: Object,
            Props: Array
        },
        mounted() {
            if (!localStorage.getItem('admin') || localStorage.getItem('admin') !== '1') this.$router.push({
                name: "Admin"
            });
            // this.editUser = this.user;
            // $.extend(this.editUser, this.user);
            //这里需要改 Props通过Manage传过来 

            /* this.socket.emit("getProps", (err, Props) => {
                if (err) console.log(err);
                else this.Props = Props;
            }); */

        },
        // updated() {
        //     this.editUser=this.user;
        //     // $.extend(this.editUser, this.user);

        //     /* this.socket.emit("getProps", (err, Props) => {
        //         if (err) console.log(err);
        //         else this.Props = Props;
        //     }); */

        // },
        destroyed() {
            if (this.socket) {
                this.socket.close();
            }
        },
        methods: {
            del() {
                console.log(`delete ${this.user.id}`);
                this.socket.emit("deleteQRcode", this.user.id, (err) => {
                    if (!err) {
                        alert(`Delete id : ${this.user.id} is successed!`);
                        this.$el.remove();
                    } else {
                        console.log(err);
                    }
                });
            },
            finishEdit() {

                var oldUser = {
                    id: parseInt(this.user.id)
                };

                $("input[type=text]").each((i, e) => {
                    oldUser[this.Props[i]] = e.value;
                })

                this.socket.emit("updateOne", oldUser, (err, data) => {
                    if (err) console.log(err);
                    else {
                        alert("modify " + this.user.id + " successfully");
                        this.editBox = false;
                        // this.user = this.editUser;
                        // $.extend(this.user, this.editUser);
                    }
                });
            },
            send() {
                var email = this.user.email || this.user.Email;
                console.log(email);

                this.emailShow = false;
                this.socket.emit(
                    "sendEmail",
                    email, {
                        img: this.user.QRimage,
                        code: this.user.eid
                    },
                    (err) => {
                        this.emailShow = true;
                        if (!err) {
                            // Re-enable button if it is not start
                            // alert("Email is sent!");
                        } else {
                            console.log(err);
                        }
                    }
                );
            },
            print() {
                this.printShow = false;
                let self = this;
                let qrcode = $("div.qrcode").html();
                $("<iframe />").attr("src", "").on("load", function () {
                    this.contentDocument.body.innerHTML = qrcode;
                    this.contentWindow.print();
                    self.printShow = true;
                }).appendTo($("div#prints"));
            }
        }
    };
</script>

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

    td > button {
        background-color: #fff;
        color: #999;
        width: auto;
        height: auto;
        font-size: 12px;
        cursor: pointer;
    }
</style>