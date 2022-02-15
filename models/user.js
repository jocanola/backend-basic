const Sequelize = require("sequelize");
const sequilize = require("../util/database");

const Users = sequilize.define("Users", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
});

module.exports = Users