var imageElement = document.getElementById("ai_test");
var gumVideo = document.getElementById("camera");
var ai = document.getElementById("ai");
var imagectx;
// var gl = ai.getContext('webgl');

// ai.addEventListener('webglcontextlost', function (e) {
//     console.log(e);
//     // ai_run()
// }, false);

// gl.getExtension('WEBGL_lose_context').loseContext();

async function ai_run() {
	// console.log(JSON.stringify(ai_config));
	// setTimeout(() => {
	try {
		if (net) {
			imagectx.drawImage(gumVideo, 0, 0, imageElement.width, imageElement.height);

			try {
				// let net = await posenet.load(ai_config.main);
				let poses = await net.estimateMultiplePoses(imageElement, ai_config.poses);

				// net.dispose();

				// console.log(pose[0].keypoints)
				ai.width = gumVideo.videoWidth;
				ai.height = gumVideo.videoHeight;
				let ctx = ai.getContext("2d");
				// ctx.beginPath();
				// draw(ctx, gumVideo.videoWidth - 100, 100, 20)
				// for (let k in pose[0].keypoints) {
				let eyes = [];
				poses.forEach(pose => {
					let eye = {};
					pose.keypoints.forEach(point => {
						// let point = pose[0].keypoints[k]
						// console.log(point);

						if (point.score >= ai_config.show) {
							if (ai_config.debug) draw(ctx, point.position.x, point.position.y, 2);
							// if (point.part === "leftEye" || point.part === "rightEye") {
							eye[point.part] = point.position;
							// draw(ctx, point.position.x, point.position.y, 2);
							// }
							// draw(ctx, point.position.x, point.position.y, 2);
						}
					});
					// console.log(eyes)
					eyes.push(eye);
				});
				// console.log(eyes);
				let ex = {};
				$("#persons").empty();
				// console.log(ai_head)
				// console.log("glasses", eye["leftEye"], ai_head["glasses"].position[0], ai_head["glasses"].position[1], ai_head["glasses"].offset)
				// console.log("hat", eye[ai_head["hat"].position[0]], eye[ai_head["hat"].position[1]], ai_head["hat"].offset)
				eyes.forEach(eye => {
					// console.log(eye)
					// console.log("hat", eye[ai_head["hat"].position[0]], eye[ai_head["hat"].position[1]], ai_head["hat"].offset)
					// if(ai_head["glass"].use) {
					// 	if (setElement("glass", eye[ai_head["glass"].position[0]], eye[ai_head["glass"].position[1]], ai_head["glass"].offset)) ex.glasses = true;
					// }
					// if(ai_head["hat"].use) {
					// 	let hat = setElement("hat", eye[ai_head["hat"].position[0]], eye[ai_head["hat"].position[1]], ai_head["hat"].offset);
					// 	if (hat) {
					// 		let eysCenter = {
					// 			x: (eye.leftEye.x - eye.rightEye.x) / 2 + eye.rightEye.x,
					// 			y: (eye.leftEye.y - eye.rightEye.y) / 2 + eye.rightEye.y
					// 		};
					// 		if (ai_config.debug) draw(ctx, eysCenter.x, eysCenter.y, 5, "#ff3d00");
					// 		// if (ai_config.debug) draw(ctx, eye.nose.x, eye.nose.y, 5);
					// 		let nose = getDistance(eysCenter, eye.nose);
					// 		// console.log(nose);
					// 		let top = parseInt(hat.css("top")) - hat.height() / 2 - nose;
					// 		hat.css("top", top);
					// 		let left = eyeCenter.x - eye.nose.x + parseInt(hat.css("left"));
					// 		hat.css("left", left);
					// 		// console.log(top)
					// 		ex.hat = true;
					// 	}
					// }

					for (let _ai in ai_head) {
						// console.log(`_ai ->`, _ai)
						_head = ai_head[_ai]
						// console.log(`_head ->`, _head)
						if (!ai_head[_ai].use) continue
						switch (_ai) {
							case "hat":
								let hat = setElement(_ai, eye[ai_head[_ai].position[0]], eye[ai_head[_ai].position[1]], ai_head[_ai].offset);
								if (hat) {
									let eysCenter = {
										x: (eye.leftEye.x - eye.rightEye.x) / 2 + eye.rightEye.x,
										y: (eye.leftEye.y - eye.rightEye.y) / 2 + eye.rightEye.y
									};
									if (ai_config.debug) draw(ctx, eysCenter.x, eysCenter.y, 5, "#ff3d00");
									// if (ai_config.debug) draw(ctx, eye.nose.x, eye.nose.y, 5);
									let nose = getDistance(eysCenter, eye.nose);
									// console.log(nose);
									let top = parseInt(hat.css("top")) - hat.height() / 2 - nose;
									hat.css("top", top);
									let left = eyeCenter.x - eye.nose.x + parseInt(hat.css("left"));
									hat.css("left", left);
									// console.log(top)
								}
								break

							case "hand":
								// console.log('wrist')
								// console.log('wrist', ai_head[_ai], eye['leftWrist'], eye['rightWrist'])
								setElementHand(_ai, 'wrist', ai_head[_ai], eye)
								break

							case "elbow":
								setElementHand(_ai, _ai, ai_head[_ai], eye)
								break

							case "ear":
								// console.log(_ai, ai_head[_ai], eye)
								setElementHand(_ai, _ai, ai_head[_ai], eye)
								break

							case "foot":
								setElementHand(_ai, _ai, ai_head[_ai], eye)
								break

							// case "belt":
							// 	let belt = setElement(_ai, eye[ai_head[_ai].position[0]], eye[ai_head[_ai].position[1]], ai_head[_ai].offset)
							// 	// console.log(belt, eye[`belt`])
							// 	if(belt && eye[`belt`]) {
							// 		belt.css({
							// 			top: `${eye[`belt`].y / gumVideo.videoHeight * gumVideo.clientHeight - hand.height() / 2 - ai_head[_ai].offset.top}px`,
							// 			left: `${eye[`belt`].x / gumVideo.videoWidth * gumVideo.clientWidth - hand.width() / 2 - ai_head[_ai].offset.left}px`
							// 		});
							// 	} else {
							// 		belt.hide()
							// 	}
							// 	break

							default:
								setElement(_ai, eye[ai_head[_ai].position[0]], eye[ai_head[_ai].position[1]], ai_head[_ai].offset)
								break
						}
					}

				});
				// if (!ex.glasses) {
				// 	$("#glasses").hide();
				// }
				// if (!ex.hat) {
				// 	$("#hat").hide();
				// }
				ai_run();

			} catch (e) {
				ai_run();
			}
		} else {
			setTimeout(() => {
				console.log(`try...`)
				ai_run();
			}, 1000)
		}
	}catch (e) {
		console.log(e)
	}
}

function setElementHand(_ai, real, ai_hand, eye) {
	let hand
	switch (ai_hand.show) {
		case 'left':
			hand = setElement(_ai, eye[ai_hand.position[0]], eye[ai_hand.position[1]], ai_hand.offset, '-1');
			if (hand && eye[`left${big(real)}`]) {
				hand.css({
					top: `${eye[`left${big(real)}`].y / gumVideo.videoHeight * gumVideo.clientHeight - hand.height() / 2 - ai_hand.offset.top}px`,
					left: `${eye[`left${big(real)}`].x / gumVideo.videoWidth * gumVideo.clientWidth - hand.width() / 2 - ai_hand.offset.left}px`
				});
			} else {
				hand.hide()
			}
			break

		case 'right':
			hand = setElement(_ai, eye[ai_hand.position[0]], eye[ai_hand.position[1]], ai_hand.offset);
			if (hand && eye[`right${big(real)}`]) {
				hand.css({
					top: `${eye[`right${big(real)}`].y / gumVideo.videoHeight * gumVideo.clientHeight - hand.height() / 2 - ai_hand.offset.top}px`,
					left: `${eye[`right${big(real)}`].x / gumVideo.videoWidth * gumVideo.clientWidth - hand.width() / 2 - ai_hand.offset.left}px`
				});
			} else {
				hand.hide()
			}
			break

		case 'both':
			let handLeft = setElement(_ai, eye[ai_hand.position[0]], eye[ai_hand.position[1]], ai_hand.offset, '-1');
			// console.log(eye[`right${big(real)}`].x, eye[`right${big(real)}`].y)
			if (handLeft && eye[`left${big(real)}`]) {
				handLeft.css({
					top: `${eye[`left${big(real)}`].y / gumVideo.videoHeight * gumVideo.clientHeight - handLeft.height() / 2 - ai_hand.offset.top}px`,
					left: `${eye[`left${big(real)}`].x / gumVideo.videoWidth * gumVideo.clientWidth - handLeft.width() / 2 - ai_hand.offset.left}px`,
					// border: '10px solid #ccc'
				});
			} else {
				handLeft.hide()
			}
			let handRight = setElement(_ai, eye[ai_hand.position[0]], eye[ai_hand.position[1]], ai_hand.offset);
			// console.log(eye[`right${big(real)}`].x, eye[`right${big(real)}`].y, handRight && eye[`right${big(real)}`] ? true : false)
			if (handRight && eye[`right${big(real)}`]) {
				handRight.css({
					top: `${eye[`right${big(real)}`].y / gumVideo.videoHeight * gumVideo.clientHeight - handRight.height() / 2 - ai_hand.offset.top}px`,
					left: `${eye[`right${big(real)}`].x / gumVideo.videoWidth * gumVideo.clientWidth - handRight.width() / 2 - ai_hand.offset.left}px`
				});
			} else {
				handRight.hide()
			}
			break
	}
}

function setElement(id, left, right, offset = { left: 0, top: 0, zoom: 1 }, scaleX = '1') {
	if (left && right) {
		let _width = getDistance(left, right) * offset.zoom * offset.defaultZoom;
		let angle = getAngle(right.x, right.y, left.x, left.y) - 90;
		let img = $("<img />").addClass(id).attr("src", ai_head[id].imageData).appendTo($("#persons"));
		// console.log(img);
		// $("#persons").append(img);
		// $(id).show()

		img.width(_width * 2 / gumVideo.videoWidth * gumVideo.clientWidth).css({
			transform: `rotate(${angle}deg) scaleX(${scaleX})`
		});

		let _left = ((right.x - left.x > 0 ? left.x : right.x) - _width / 2) / gumVideo.videoWidth * gumVideo.clientWidth;
		let _top = (right.y - left.y > 0 ? right.y : left.y) / gumVideo.videoHeight * gumVideo.clientHeight - img.height() / 2;
		// console.log(_left + offset.l, _top + offset.t)
		// console.log(img)
		img.css({
			left: _left - offset.left,
			top: _top - offset.top
		});
		// console.log(img)
		// img.css("left", _left + offset.left).css("top", _top + offset.top)
		return img;
	} else {
		// $(id).hide();
		return false;
	}
}

console.log(`AI Running.`);
gumVideo.onloadedmetadata = () => {
	imageElement.width = gumVideo.videoWidth;
	imageElement.height = gumVideo.videoHeight;
	imagectx = imageElement.getContext("2d");

	ai_run();
};

function big(txt) {
	return txt.substring(0, 1).toUpperCase() + txt.substring(1).toLowerCase()
}

function draw(ctx, x, y, r, color = "#4898f8") {
	ctx.beginPath(); // 开启绘制路径
	ctx.arc(x, y, r, 0, 2 * Math.PI); // 绘制圆 参数依次为 圆的横坐标/纵坐标/半径/绘制圆的起始位置/绘制圆的弧度大小
	ctx.fillStyle = color; // 设置填充颜色
	ctx.fill(); // 填充颜色
	ctx.closePath(); // 关闭绘制路径
}


function getDistance(a, b) {
	let dx = Math.abs(b.x - a.x);
	let dy = Math.abs(b.y - a.y);
	let dis = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	return parseInt(dis);
}


function getAngle(px, py, mx, my) { //获得人物中心和鼠标坐标连线，与y轴正半轴之间的夹角
	var x = Math.abs(px - mx);
	var y = Math.abs(py - my);
	var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	var cos = y / z;
	var radina = Math.acos(cos); //用反三角函数求弧度
	var angle = Math.floor(180 / (Math.PI / radina)); //将弧度转换成角度

	if (mx > px && my > py) { //鼠标在第四象限
		angle = 180 - angle;
	}
	if (mx == px && my > py) { //鼠标在y轴负方向上
		angle = 180;
	}
	if (mx > px && my == py) { //鼠标在x轴正方向上
		angle = 90;
	}
	if (mx < px && my > py) { //鼠标在第三象限
		angle = 180 + angle;
	}
	if (mx < px && my == py) { //鼠标在x轴负方向
		angle = 270;
	}
	if (mx < px && my < py) { //鼠标在第二象限
		angle = 360 - angle;
	}
	return angle;
}
