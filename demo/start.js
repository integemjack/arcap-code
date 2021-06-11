const io = require("socket.io-client");

const socket = io("https://localhost:2012/login", {
	transports: ["websocket"],
	rejectUnauthorized: false
});

socket.on("connect", () => {
	console.log("connect is successfully!");
	socket.emit("loginStart");
	socket.disconnect();
});

socket.on("connect_error", err => {
	console.log("It have some error to connect port:2012 server.", err);
	socket.disconnect();
});
