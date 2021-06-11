"use strict";

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define("User", {
		// token is a secure identifer for the user,
		// using to login to website to their photos or videos
		uuid: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV1
		},
		token: {
			type: DataTypes.STRING
		},
		name: {
			allowNull: false,
			type: DataTypes.STRING
		},
		email: {
			allowNull: false,
			type: DataTypes.STRING
		},
		media: {
			allowNull: false,
			type: DataTypes.JSON
		},
		mac: {
			type: DataTypes.STRING
		},
		clientjs: {
			type: DataTypes.TEXT
		},
		send: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	});

	User.associate = function(models) {
		// define assocaiation
	};

	return User;
};
