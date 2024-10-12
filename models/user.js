const { DataTypes } = require("sequelize");
const { postgresClient } = require("../db/postgres");

const User = postgresClient.define(
    'User', 
    {
        userID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        name:{
            type: DataTypes.STRING,
            allowNull: false
        },

        imageUrl:{
            type: DataTypes.STRING
        },

        email:{
            type: DataTypes.STRING,
            allowNull: false
        },

        phone:{
            type: DataTypes.STRING
        },

        quote: {
            type: DataTypes.STRING
        }
    },

    {
        tableName: "yuser"
    }
);

module.exports = {User};
