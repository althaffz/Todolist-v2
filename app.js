const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-althaf:test123@althaffz.qoebe.mongodb.net/todolistDB?retryWrites=true&w=majority",
{useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false});


const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model('item', itemsSchema);
const List = mongoose.model("list", listSchema);

const item_1 = new Item ({
  name: "Welcome to your todolist!"
});

const item_2 = new Item ({
  name: "Hit + to add new item to the list"
});

const item_3 = new Item ({
  name: "<-- Hit this to remove the item form the list"
})

const defaultItems = [item_1, item_2, item_3];






app.get("/", function(req, res) {
  const day = date.getDate();
  Item.find({}, function(err, items){
    if (items.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err)
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.render("list", {listTitle: day, newListItems: items});
    }
      });

});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, async function(err, results){
    if(!err){
      if(!results){
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        await list.save();
        res.redirect('/'+ customListName);

      }else {
        res.render('list', {listTitle: results.name, newListItems: results.items});
      }
    }
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(listName);
  const newItem = Item ({
    name: itemName
  });

  if (listName === date.getDate()){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, async function(err, results){
      if(!err){
        results.items.push(newItem);
        await results.save();
        res.redirect("/" + listName);
      }
    });
  }

});

app.post( "/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === date.getDate()){
    Item.findOneAndRemove({_id: checkedItemID}, ()=> console.log("Deleted"))
    res.redirect('/');
  } else {
    List.updateOne({name: listName}, {$pull: {items: {"_id": checkedItemID}}}, function(err){
      if (!err){
        res.redirect('/' + listName);
      }
    });
  }

});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
