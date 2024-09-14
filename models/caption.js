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
        // Status Codes:
        // -1: Declined Request
        // 0: Requested
        // 1: Accepted
    },

    {
        tableName: "ycaption"
    }
);

module.exports = {Caption};