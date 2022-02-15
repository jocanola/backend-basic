const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const db = require("./util/database");
const products = require("./models/product");
const Users = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
// const User = require("../../../Jokanola/Useful Material/Backend/Udemy - NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno) 2021-11/11 - Understanding Sequelize/14896532-07-creating-and-managing-a-user/07-creating-and-managing-a-user/models/user");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

products.belongsTo(Users, { constraints: false, onDelete: "CASCADE" });
Users.hasMany(products);
Users.hasOne(Cart);
Cart.belongsTo(Users);
Cart.belongsToMany(products, { through: CartItem });
products.belongsToMany(Cart, { through: CartItem });
app.use((req, res, next) => {
  Users.findByPk(1)
    .then((user) => {
      req.user = user.dataValues.id;
      // console.log("user data", user);
    })
    .catch((error) => console.log(error));
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);
db.sync()
  .then((user) => {
    return Users.findByPk(1)
      .then((user) => {
        if (!user) {
          return Users.create({ name: "Yusuff", email: "test@test.com" });
        }
        return user;
      })
      .then();
  })
  .then()
  .catch((error) => console.log(error));
app.listen(3000);
