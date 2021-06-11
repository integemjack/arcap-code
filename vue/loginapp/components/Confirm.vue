<template>
<div id="confirm" class="login">
    <div class="logo">
        <router-link to="/">
            <img src="/image/logo.png" />
        </router-link>
    </div>
    <ul>
        <li v-if="this.lastUser">
            <span id="warn-label">You AR experience memory will be sent to following person:</span>
        </li>
        <li>
            <label>Name:</label>
            <input id="name_once" v-model="name" />
        </li>
        <li>
            <label>Email:</label>
            <input id="email_once" v-model="email"/>
        </li>
        <li class="button">
            <router-link :to="{ path: '/start', query: { theme, name, email } }">
                <button class="command" id="video" :disabled="!agree">CONFIRM</button>
            </router-link>
        </li>
        <li>
            <router-link :to="{ path: '/agreement', query: { theme, name, email } }">
                <input type="checkbox" id="agree" v-model="agree">
                <label id="agree-label" for="checkbox">Yes, I agree to the agreement</label>
            </router-link>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    name: 'Confirm',
    props: ['theme', 'name', 'email', 'agree', 'lastUser'],
    data () {
        return {
        }
    },
    mounted () {
        if (this.lastUser) {
            let lastUser = JSON.parse(localStorage.getItem('lastUser'));

            console.log('Use last user:', lastUser);
            const { name, email } = lastUser;
            this.name = name || this.name;
            this.email = email || this.email;
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
