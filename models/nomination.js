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
        }
    },

    {
        tableName: "ynomination"
    }
);

module.exports = { Nomination };