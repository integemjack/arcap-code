"use strict";

const request = require("request");
const logger = require("./logger");

module.exports = config => {
	return new Promise((resolve, reject) => {
		logger.info(`Start get youku access token...`);
		request.post(
			"https://api.youku.com/oauth2/token.json",
			{
				form: {
					client_id: config.client_id, //'0d528cd5f5c9cece',
					grant_type: "refresh_token",
					refresh_token: config.refresh_token //'8e02c4ca795ebc956032024d8f0ece68'
				}
			},
			(err, resp, body) => {
				if (err) return reject(`Get youku access token is error: ${err}`);
				logger.info(`Get youku access token is success!`);
				resolve(body.access_token);
			}
		);
	});
};
