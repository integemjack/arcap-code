"use strict";

module.exports = function(sequelize, DataTypes) {
	var Tags = sequelize.define("Tags", {
		value: {
			allowNull: false,
			type: DataTypes.STRING,
			unique: true
		},
		use: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		on: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	});

	Tags.associate = function(models) {
		// define assocaiation
	};

	return Tags;
};
