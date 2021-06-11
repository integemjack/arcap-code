<template>
    <div class="main">
        <div>
            <router-link to="/"><img style="width: 200px" src="/image/logo.png"/></router-link>
        </div>
        <div>
            <table style="width: 100%">
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Bar Code</th>
                    <th>Link</th>
                    <th>Qr Code</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="user in users" :key="user.id">
                    <td>{{user.email}}</td>
                    <td>{{user.token}}</td>
                    <td>
                        <a target="_blank" :href="`https://myar.integem.com/token/${user.token}`">{{`https://myar.integem.com/token/${user.token}`}}</a>
                    </td>
                    <td>
                        <qriously :value="`https://myar.integem.com/token/${user.token}`" :size="100"/>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
	function indexAry(ary) {
		let newAry = [],
			email = [];
		for (let i = 0; i < ary.length; i++) {
			/* 方案一 */
			// indexOf 判断新数组中是否存在这一项，存在返回存在的返回对应的索引，不存在返回-1
			/*if (newAry.indexOf(ary[i]) == -1) {
                 newAry.push(ary[i]);
             }*/
			/* 方案二 */
			// includes 判断新数组中是否存在这一项，存在true，不存在false
			if (!email.includes(ary[i].email)) {
				newAry.push(ary[i]);
				email.push(ary[i].email);
			}
		}
		return newAry;
	}

	export default {
		name: "barcode",
		data() {
			return {
				socket: io("/QRcode"),
				users: []
			};
		},
		mounted() {
			this.socket.emit("getBarCodeUsers", users => {
				this.users = indexAry(users);
				console.log(users);
			});
		}
	};
</script>

<style scoped>
    .main {
        max-width: 1200px;
        margin: auto;
        padding: 0;
    }

    table {
        width: 100%;
        border: 1px solid #4898f8;
        border-collapse: collapse;
        margin-bottom: 30px;
    }

    table thead {
        background: #4898f8;
        color: #fff;
    }

    table tr {
        padding: 5px 0;
    }

    table td,
    table th {
        line-height: 30px;
        text-align: center;
    }

    table th {
        border-left: 1px #fff solid;
    }

    table th:first-child {
        border-left: 0 #fff solid;
    }

    table td > img {
        vertical-align: middle;
        width: 39px;
        height: 39px;
    }

    table tr {
        border-bottom: 1px solid #4898f8;
    }

    table tr:last-child {
        border-bottom: 0 solid #4898f8;
    }
</style>
