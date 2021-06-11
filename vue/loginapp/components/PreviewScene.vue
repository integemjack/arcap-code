<template>
<div id="preview-scene" class="login">
    <div class="logo">
        <router-link to="/">
            <img src="/image/logo.png" />
        </router-link>
    </div>
    <ul>
        <li>
            <h1>{{ name }}</h1>
        </li>
        <li>
            <img :src="`/themes/${theme}/cover`" style="width: 100%">
        </li>
        <li>
            <p style="font-size: 24px">{{ desc }}</p>
        </li>
        <li class="button">
            <router-link :to="{ path: '/login', query: { theme } }">
                <button class="command" id="video">PLAY</button>
            </router-link>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    name: 'PreviewScene',
    props: ['theme'],
    data () {
        return {
            name: '',
            desc: '',
        }
    },
    mounted() {
        ({ name: this.name, desc: this.desc } = this.$root.$data.scenes.filter(s => s.id == this.theme)[0]);
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
