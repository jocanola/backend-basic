const Sequelize = require("sequelize");
const sequilize = require("../util/database");

const Cart = sequilize.define("Cart", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = Cart;
