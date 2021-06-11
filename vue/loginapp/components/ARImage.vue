<template>
<div id="ar-image" class="login">
    <div class="logo">
        <router-link to="/">
            <img src="/image/logo.png" />
        </router-link>
    </div>
    <ul>
        <li>
            <h1>Images</h1>
        </li>
        <li>
            <image-picker v-model="pick" :images="photos" v-once></image-picker>
        </li>
        <li class="button">
            <button @click="print" :disabled="printing">{{ printing ? 'Printing...' : 'Print' }}</button>
        </li>
        <li>
            <p>&nbsp;</p>
        </li>
    </ul>
    <div id="prints"></div>
</div>
</template>

<script>
import ImagePicker from './ImagePicker.vue';

export default {
    name: 'ARImage',
    components: { ImagePicker },
    data () {
        return {
            photos: [],
            pick: '',
            printing: false
        }
    },
    methods: {
        print () {
            if (!this.pick) {
                alert('Please choose one to print.');
                return;
            }
            this.printing = true;
            let self = this;
            $('<iframe />').attr('src', this.pick).on("load", function () {
                this.contentWindow.print();
                self.printing = false;
            }).appendTo($('div#prints'));
        }
    },
    created () {
        let ardata = this.$root.$data.ardata;
        if (ardata) {
            this.photos = ardata.media.photos.map((p, i) => {
                return {
                    src: `/${ardata.id}/photo/${p}`,
                    value: i
                };
            })
            console.log('Photos:', this.photos);
        }
    }
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div#prints {
    display: none;
}
</style>
