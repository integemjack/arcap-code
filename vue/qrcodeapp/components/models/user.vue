<template>
    <tr>
        <td>
            <input type="checkbox" :value="user.id" />
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
                    <img :src="user['QRimage']" class="qrcode" />
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
            <button @click="edit()">Edit</button>
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
            Props: Array,
            index: Number
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
        	edit() {
				this.$emit('edit', this.index);
            },
            del() {
                console.log(`delete ${this.user.id}`);
                this.socket.emit("deleteQRcode", this.user.id, (err) => {
                    if (!err) {
                        alert(`Delete id : ${this.user.id} is successed!`);
                        // this.$el.remove();
                        this.$emit('del', this.index);
                    } else {
                        console.log(err);
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
    td > button {
        background-color: #fff;
        color: #999;
        width: auto;
        height: auto;
        font-size: 12px;
        cursor: pointer;
    }
</style>