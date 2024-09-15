const { DataTypes } = require('sequelize');
const { postgresClient } = require('../db/postgres');

const Nomination = postgresClient.define(
    'Nomination',
    {
        nominationID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        nominatorID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        targetID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },

    {
        tableName: "ynomination"
    }
);

module.exports = { Nomination };