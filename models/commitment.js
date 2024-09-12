const { DataTypes } = require('sequelize');
const { postgresClient } = require('../db/postgres');

const Commitment = postgresClient.define(
    'Commitment', 
    {
        commitmentID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        commitment_imageUrl:{
            type: DataTypes.STRING
        },

        commitment_name:{
            type: DataTypes.STRING,
            allowNull: false
        }
    },

    {
        tableName: "ycommitment"
    }
);

module.exports = {Commitment};
