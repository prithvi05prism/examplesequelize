const { DataTypes } = require("sequelize");
const { postgresClient } = require("../db/postgres");

const Poll = postgresClient.define(
  'Poll',
  {
    pollID:{
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },

    question:{
      type: DataTypes.STRING,
      allowNull: false
    },

    votesCount:{
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    commitmentID:{
      type: DataTypes.UUID,
      allowNull: false
    }
  },

  {
    tableName: "ypoll"
  }
)

module.exports = {Poll};
