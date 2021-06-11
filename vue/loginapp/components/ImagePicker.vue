<template>
<select class="image-picker">
    <option value=""></option>
    <option v-for="img in images" :key="img.value" :data-img-src="img.src" :data-img-alt="img.alt" :value="img.src">{{img.src}}</option>
</select>
</template>

<script>
export default {
    name: 'ImagePicker',
    props: ['images', 'selected'],
    model: {
        prop: 'selected',
        event: 'changed'
    },
    mounted () {
        $(this.$el).imagepicker({
            changed: () => {
                // For multi-select, put multiple="multiple" in template
                this.$emit('changed', $(this.$el).val());
            }
        });
    },
    beforeDestroy () {
        $(this.$el).data('picker').destroy();
    }
}
</script>

<style>
.thumbnails.image_picker_selector  img {
    width: 100%;
}
</style>
