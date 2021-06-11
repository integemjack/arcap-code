<template>
    <div id="login" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png" />
            </router-link>
        </div>
        <ul>
            <li v-for="(Prop, key) in Props" :key="key" >
                <label>{{Prop}}:</label>
                <input type="text" v-model="QueryData[Prop]" />
            </li>

            <li class="button">
                <router-link :to="{ path: '/confirm', query: { Props, QueryData, agree: true } }">
                    <button class="command" id="video">NEXT</button>
                </router-link>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "Login",
        data() {
            return {
                // name: "",
                // email: "",
                socket: io("/QRcode"),
                Props:[],
                QueryData:{}
            };
        },
        mounted() {
            if (!localStorage.getItem('admin') || localStorage.getItem('admin') !== '1') this.$router.push({
                name: "Admin"
            });
            this.socket.emit("getProps",(err,Props)=>{
                if(err) console.log(err);
                else this.Props = Props;
            })
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    div.login ul li input {
        padding: 10px 0 10px 140px;
    }
</style>