const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("online-shopping", "root", "admin", {
  host: "localhost",
  dialect: "mysql",
});

module.exports = sequelize;
