<template>
<div class="Model">
    <div v-if="visible">
        <div class="model-mask"></div>
        <div class="model-wrap">
            <div class="model">
                <div class="model-content">
                    <div class="model-header">
                        <div class="model-title">{{ title }}</div>
                    </div>
                    <div class="model-body">
                        <slot></slot>
                    </div>
                    <div class="model-footer">
                        <div class="btn-area">
                            <slot name="footer"></slot>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    data() {
        return {};
    },
    props: ["visible", "title"]
};
</script>

<style scoped>
.model-mask {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background-color: #373737;
    background-color: rgba(0, 0, 0, 0.65);
    z-index: 1000;
}

.model-wrap {
    display: flex;
    position: fixed;
    justify-content: center;
    overflow: auto;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
}

.model {
    width: 520px;
    margin-top: 100px;
}

.model-content {
    position: relative;
    background-color: #fff;
    border: 0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.model-title {
    margin: 0;
    font-size: 16px;
    line-height: 22px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
}

.model-header {
    padding: 16px 24px;
    border-radius: 4px 4px 0 0;
    background: #fff;
    color: rgba(0, 0, 0, 0.65);
    border-bottom: 1px solid #e8e8e8;
}

.model-body {
    padding: 24px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
}

.model-footer {
    border-top: 1px solid #e8e8e8;
    padding: 10px 16px;
    text-align: right;
    border-radius: 0 0 4px 4px;
}

.model-footer .btn-primary {
    margin-left: 8px;
    margin-bottom: 0;
    background-color: #1890ff;
    color: white;
}
</style>
