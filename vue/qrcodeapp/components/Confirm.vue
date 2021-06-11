<template>
    <div id="confirm" class="login">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png" />
            </router-link>
        </div>
        <ul>
            <li v-for="(Prop, key) in Props" :key="key" >
                <label>{{Prop}}:</label>
                <input type="text" v-model=QueryData[Prop] />
            </li>

            <!-- <li class="button">
                <router-link :to="{ path: '/qrcode', query: { name, email } }">
                    <button class="command" id="video" :disabled="!agree">CONFIRM</button>
                </router-link>
            </li> -->
            
            <li class="button">
                <button class="command" id="video" :disabled="!agree" @click="confirmRegiste">CONFIRM</button>
            </li>

            <li>
                <router-link :to="{ path: '/agreement', query: { Props, QueryData,agree } }">
                    <input type="checkbox" id="agree" v-model="agree">
                    <label id="agree-label" for="checkbox">Yes, I agree to the agreement</label>
                </router-link>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "Confirm",
        props: ["Props", "QueryData", "agree"],
        data() {
            return {
                socket: io("/QRcode")
            };
        },
        mounted() {
            if (!localStorage.getItem("admin") || localStorage.getItem("admin") !== "1") this.$router.push({
                name: "Admin"
            });
        },
        methods:{
            confirmRegiste(){
                this.socket.emit("registUser",this.QueryData,(err,id)=>{
                    if(err) console.log(err);
                    else {
                        alert("create user success! id: "+id);
                        window.location.href = "/#/manager";
                    }
                })
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>