"use strict";

module.exports = function(sequelize, DataTypes) {
	var QRcode = sequelize.define("QRcode", {
		// token is a secure identifer for the user,
		// using to login to website to their photos or videos
		name: {
			allowNull: false,
			type: DataTypes.STRING
		},
		email: {
			allowNull: false,
			type: DataTypes.STRING
		}
	});

	QRcode.associate = function(models) {
		// define assocaiation
	};

	return QRcode;
};
