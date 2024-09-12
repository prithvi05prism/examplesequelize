const { DataTypes } = require('sequelize');
const { postgresClient } = require('../db/postgres');

const Caption = postgresClient.define(
    'Caption',
    {
        captionID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        writerID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        targetID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        caption:{
            type: DataTypes.STRING,
        },

        status:{
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },

    {
        tableName: "ycaption"
    }
);

module.exports = {Caption};