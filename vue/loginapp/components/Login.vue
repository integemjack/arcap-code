<template>
    <div id="login" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png"/>
            </router-link>
        </div>
        <div class="admin">
            <a :href="domain" target="_blank">
                <img src="/image/admin.png"/>
            </a>
        </div>
        <ul>
            <li class="button">
                <router-link :to="{ path: '/scan', query: { theme } }">
                    <button class="command" id="scan">SCAN</button>
                </router-link>
            </li>
            <li>
                <label>Name:</label>
                <input id="name" v-model="name"/>
            </li>
            <li>
                <label>Email:</label>
                <input id="email" v-model="email"/>
            </li>
            <li class="button">
                <button class="command" id="video" @click="login">LOGIN</button>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "Login",
        data() {
            return {
                name: "",
                email: "",
                domain:""
            };
        },
        methods: {
            login() {
                localStorage.setItem("lastUser", JSON.stringify({name: this.name, email: this.email}));
                this.$router.push({path: "/"});
            }
        },
        mounted () {
            // 是否登陆
            if(localStorage.getItem("lastUser")) {
                try {
                    JSON.parse(localStorage.getItem('lastUser'));
                    this.$router.push({path: '/'});
                } catch (e) {
                    localStorage.removeItem('lastUser');
                    localStorage.removeItem("userInfo");
                }
            }
    
            this.domain = "http://"+document.domain+":2018/";
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
