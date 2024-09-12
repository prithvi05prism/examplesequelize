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

        personalEmail:{
            type: DataTypes.STRING
        },

        phone:{
            type: DataTypes.STRING
        },

        bitsId: {
            type: DataTypes.STRING,
            allowNull: false
        },

        quote: {
            type: DataTypes.STRING
        },

        branchCode: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },

        senior:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },

    {
        tableName: "yuser"
    }
);

module.exports = {User};
