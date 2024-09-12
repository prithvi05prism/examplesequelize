const {Sequelize} = require("sequelize");

const postgresClient = new Sequelize('testingyearbook', 'postgres', 'postgres', {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
});

module.exports = {postgresClient};