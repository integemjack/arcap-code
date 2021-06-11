<template>
    <div id="login" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png" />
            </router-link>
        </div>
        <!--<div class="admin">-->
        <!--<router-link to="/admin">-->
        <!--<img src="/image/admin.png" />-->
        <!--</router-link>-->
        <!--</div>-->
        <ul>
            <li v-for="Prop in Props">
                <label>{{Prop}}:</label>
                <input type="text" v-model=QueryData[Prop] />
            </li>

            <!-- <li>
                <label>Name:</label>
                <input id="name" v-model="name" />
            </li>
            <li>
                <label>Email:</label>
                <input id="email" v-model="email" />
            </li> -->

            <li class="button">
                <router-link :to="{ path: '/confirm', query: { Props:Props,QueryData:QueryData, agree: true } }">
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
            localStorage.removeItem("from");
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
</style>