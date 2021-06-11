<template>
<div id="agreement" class="login">
    <div class="logo">
        <router-link to="/">
            <img src="/image/logo.png" />
        </router-link>
    </div>
    <ul>
        <li>
            <div class="content" v-html="agreement"></div>
        </li>
        <li>
            <div class="foot">
                <router-link :to="{ path: '/confirm', query: { Props:Props,QueryData:QueryData, agree: true } }">
                    <button class="ok">Yes, agree</button>
                </router-link>
                <router-link :to="{ path: '/confirm', query: { Props:Props,QueryData:QueryData, agree: false } }">
                    <button>No, disagree</button>
                </router-link>
            </div>
        </li>
    </ul>
</div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'Agreement',
    props: ["Props", "QueryData", "agree"],
    data () {
        return {
            agreement: 'Loading...'
        }
    },
    created () {
        axios.get('/agreement.html')
        .then(response => {
            this.agreement = response.data;
        })
        .catch(e => {
            console.error(e);
        });
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
