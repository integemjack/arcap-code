"use strict";

module.exports = function(sequelize, DataTypes) {
	var Themes = sequelize.define("Themes", {
		name: {
			allowNull: false,
			type: DataTypes.STRING
		},
		barcode: {
			allowNull: false,
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		nfc: {
			allowNull: false,
			type: DataTypes.STRING,
			defaultValue: ""
		},
		tag: {
			allowNull: false,
			type: DataTypes.JSON
		},
		sort: {
			allowNull: false,
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		location: {
			allowNull: false,
			type: DataTypes.STRING,
			unique: true
		},
		description: {
			allowNull: false,
			type: DataTypes.STRING
		},
		thumbnail: {
			allowNull: false,
			type: DataTypes.STRING
		}
	});

	Themes.associate = function(models) {
		// define assocaiation
	};

	return Themes;
};
