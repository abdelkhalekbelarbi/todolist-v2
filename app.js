const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { render, name } = require("ejs");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let Item; // Declare Item in outer scope
let defaultItems = []; // Declare defaultItems in outer scope
let List; // Declare List in outer scope

(async () => {
  await mongoose.connect("mongodb+srv://admin-belarbi:belarbi27@cluster0.kldz8wn.mongodb.net/todolistDB");

  const itemsSchema = new mongoose.Schema({ name: String });
  Item = mongoose.model("Item", itemsSchema); 

  defaultItems = [
    new Item({ name: "Welcome to your todolist" }),
    new Item({ name: "Hit the + button to add a new item" }),
    new Item({ name: "Hit this to delete an item" })
  ];

  const listschema = {
    name: String,
    items: [itemsSchema],
  };
  List = mongoose.model("List", listschema);
})();

app.get("/", (req, res) => {
  Item.find({})
    .then(foundItems => {
      console.log(foundItems);
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
    .catch(err => {
      console.error(err);
    });
});

app.get("/:customlistName", function (req, res) {
  const customlistName = _.capitalize(req.params.customlistName);

  List.findOne({ name: customlistName })
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customlistName,
          items: defaultItems,
        });

        list.save().then(() => {
          res.redirect("/" + customlistName);
        }).catch(err => console.error(err));
        
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => console.error(err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save().then(() => res.redirect("/"));
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => res.redirect("/" + listName));
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId) // ✅ fixed here
      .then(() => res.redirect("/"))
      .catch(err => console.log(err));
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => res.redirect("/" + listName))
      .catch(err => console.log(err));
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
