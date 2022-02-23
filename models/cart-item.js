const Sequelize = require("sequelize");
const sequilize = require("../util/database");

const CartItem = sequilize.define("CartItem", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  quatity: Sequelize.INTEGER,
});

module.exports = CartItem;
