const { DataTypes } = require('sequelize');
const { postgresClient } = require('../db/postgres');

const Vote = postgresClient.define(
    'Vote',
    {
        voteID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        pollID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        voterID:{
            type: DataTypes.UUID,
            allowNull: false
        },

        targetID:{
            type: DataTypes.UUID,
            allowNull: false
        }
    },

    {
        tableName: "yvote"
    }
)

module.exports = {Vote};