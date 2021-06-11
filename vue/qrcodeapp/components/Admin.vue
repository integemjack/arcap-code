<template>
    <div id="admin" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>
        <ul>
            <li>
                <h1>Admin</h1>
            </li>
            <li>
                <label>Password:</label>
                <input id="password" type="password" v-model="password"/>
            </li>
            <li class="button">
                <button class="command" id="video" @click="login">LOG IN</button>
            </li>
        </ul>
    </div>
</template>

<script>
	export default {
		name: "Admin",
		data() {
			return {
				socket: io("/QRcode"),
				password: ""
			};
		},
		methods: {
			login() {
				this.socket.emit("configGet", (err, data) => {
					if (err) {
						return console.error(err);
					}
					if (this.password != data.config.password) {
						alert("Wrong password");
					}
					else {
						localStorage.setItem("admin", "1");
						this.$router.push({name: "Index"});
					}
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
