<template>
    <div id="main" class="main">
        <div class="logo">
            <router-link to="/">
                <img src="/image/logo.png" />
            </router-link>
        </div>
        <div class="content">
            <router-link to="/reg">
                <button class="command new">Register New User</button>
            </router-link>
        </div>
        <div class="content">
            <router-link to="/manager">
                <button class="command new">User Management</button>
            </router-link>
        </div>
        <div class="content">
            <router-link to="/themes">
                <button class="command new">Themes Management</button>
            </router-link>
        </div>
        <div class="content">
            <router-link to="/barcode">
                <button class="command new">Bar Code Users</button>
            </router-link>
        </div>
        <!-- <div class="content" style="margin-bottom: 30px;">
            <router-link to="/setting">
                <button class="command new">System Setting</button>
            </router-link>
        </div> -->

        <div class="content">
            <button class="command" @click="logout">Log Out</button>
        </div>
    </div>
</template>

<script>
export default {
	name: "index",
	mounted() {
		if (
			!localStorage.getItem("admin") ||
			localStorage.getItem("admin") !== "1"
		)
			this.$router.push({ name: "Admin" });
	},
	methods: {
		logout: function() {
			localStorage.removeItem("admin");
			this.$router.push({ name: "Admin" });
		}
	}
};
</script>

<style scoped>
button {
	cursor: pointer;
}

button.new {
	border: 1px #0088cc solid;
	color: #0088cc;
	background: #fff;
}
</style>
