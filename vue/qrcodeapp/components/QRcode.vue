<template>
    <div id="main" class="main">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>
        <div class="content qrcode" v-show="show">
            <img :src="QRcode" class="qrcode"/>
        </div>
        <div class="content">
            <button id="send" @click="send" :disabled="!emailShow">{{ !emailShow ? "Sending..." : "EMAIL" }}</button>
        </div>
        <div class="content">
            <button id="print" @click="print" :disabled="!printShow">{{ !printShow ? "Printing..." : "PRINT" }}</button>
        </div>
        <div id="prints"></div>
    </div>
</template>

<script>
	export default {
		name: "QRcode",
		props: ["name", "email"],
		data() {
			return {
				code: ""
			};
		},
		mounted() {
			if(!localStorage.getItem('admin') || localStorage.getItem('admin') !== '1') this.$router.push({name: "Admin"});
			this.socket.emit(
				"getQRcode",
				{
					name: this.name,
					email: this.email
				},
				(err, QRcode) => {
					if (!err) {
						// Re-enable button if it is not start
						this.QRcode = QRcode.image;
						this.code = QRcode.code;
						this.show = this.emailShow = this.printShow = true;
					} else {
						console.log(err, QRcode);
					}
				}
			);
		},
		methods: {
			send() {
				this.emailShow = false;
				this.socket.emit(
					"sendEmail",
					this.email,
					{
						img: this.QRcode,
						code: this.code
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
		},
		destroyed() {
			if (this.socket) {
				this.socket.close();
			}
		},
		data() {
			return {
				QRcode: "",
				show: false,
				emailShow: false,
				printShow: false,
				socket: io("/QRcode")
			};
		}
	};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    div#prints {
        display: none;
    }
</style>
