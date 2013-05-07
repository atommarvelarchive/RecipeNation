var port = process.env.PORT || 5000;

var mongoUri = process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://localhost'; 

//setup express, mongo, and server vars
var express = require("express"),
    app = new express();
    

var mongo = require('mongodb');
var ObjectId = mongo.ObjectID;
 
var Server = mongo.Server,
   Db = mongo.Db;
 
var server = new Server(mongoUri, 27017, {auto_reconnect: true});
var recipedb = new Db('recipe', server);

app.set('view engine', 'ejs');
var fs = require('fs');

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/views'));


//init template data
var header = fs.readFileSync("head.txt","utf8");
var footer = fs.readFileSync("footer.txt","utf8");
var navbar = fs.readFileSync("navbar.txt","utf8");


var templateData = {	
	head: header,
	footer: footer,
	navbar: navbar
	}
//console.log(header);

// Homepage
app.get('/', function(req, res){
	res.render('home', {td:templateData});	
});


app.get('/recipes', function(req,res){
	mongo.Db.connect(mongoUri, function (err, db) {
	db.collection('recipe', function(err, coll){
    coll.find({},function(err, cursor){
      cursor.toArray(function(err, arr){		  
		  arr.sort(function(a,b){			  
			 if(a.title<b.title) return -1;
			 if(a.title===b.title) return 0;
			 if(a.title>b.title) return 1; 
		  });
        res.render("recipe_list", {recipes: arr, td:templateData});
      });
    });
    });
  });
});

app.get("/recipe/:id", function(req, res){
  var recipe_id = req.params['id'];  
  if (recipe_id){
	mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('recipe', function(err, coll){
      coll.findOne({_id:new ObjectId(recipe_id)}, function(err, recipe){
        res.render("recipe", {id: recipe_id, recipe: recipe, td:templateData});
      });
    });
    });
  } else {
    res.send(404);
  }
});

// This takes the user to a page that can be used to submit a recipe.
app.get('/newrecipe', function(req, res){	
	res.render('new_recipe', {td:templateData});
});

app.get('/updaterecipe/:id', function(req, res){
	var recipe_id = req.params['id'];  
	if (recipe_id){
	mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('recipe', function(err, coll){
      coll.findOne({_id:new ObjectId(recipe_id)}, function(err, recipe){
        res.render('update_recipe',{recipe: recipe, td:templateData});
      });
    });
    });
  } else {
    res.send(404);
  }	
});

app.put('/updaterecipe/:id',function(req, res){	
	var recipe_id = req.params['id'];
	var ingreds = new Array();
	  var instr = new Array();
	  var i = 0;
	  for(i=0; i<=20;i++){
		  if(req.body['ingredient'+i])
			ingreds[ingreds.length]={item: req.body['ingredient'+i], category: req.body['category'+i]};
	  }
	  for(i=0; i<=20;i++){
		  if(req.body['newingredient'+i])
			ingreds[ingreds.length]={item: req.body['newingredient'+i], category: req.body['newcategory'+i]};
	  }
	  for(i=0; i<=10;i++){
		  if(req.body['step'+i])
			instr[instr.length]=req.body['step'+i];  			
	  }
	  for(i=0; i<=10;i++){
		  if(req.body['newstep'+i])
			instr[instr.length]=req.body['newstep'+i];  			
	  }
	  var new_recipe = {
		  title: req.body['title'],
		  servingSize: req.body['size'],
		  ingredients: ingreds,
		  instructions: instr
	  }; 
		mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('recipe', function(err, coll){
        coll.update({_id:ObjectId(recipe_id)},new_recipe, function(err){
			res.redirect('/');
        });
      });  
      });    
});

app.post("/newrecipe", function(req, res){	
	//console.log(req.body);
  if (req.body['title']){
	  var ingreds = new Array();
	  var instr = new Array();
	  var i = 0;
	  for(i=0; i<=20;i++){
		  if(req.body['ingredient'+i])
			ingreds[ingreds.length]={item: req.body['ingredient'+i], category: req.body['category'+i]};
	  }
	  for(i=0; i<=10;i++){
		  if(req.body['step'+i])
			instr[instr.length]=req.body['step'+i];  			
	  }
    var new_recipe = {
      title: req.body['title'],
      servingSize: req.body['size'],
      ingredients: ingreds,
      instructions: instr
    };    
    //console.log(new_recipe);
    mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('recipe', function(err, coll){
      coll.insert(new_recipe, function(err){
        res.redirect('/');
      });
    });
    });
  } else {
    res.send(400);
  }
});

app.get('/newgroceryl', function(req, res){
	mongo.Db.connect(mongoUri, function (err, db) {
	db.collection('recipe', function(err, coll){
    coll.find({},function(err, cursor){
      cursor.toArray(function(err, arr){
		  arr.sort(function(a,b){			  
			 if(a.title<b.title) return -1;
			 if(a.title===b.title) return 0;
			 if(a.title>b.title) return 1; 
		  });
		res.render('new_grocerylist', {recipes:arr, td:templateData});
      });
    });
    });
  });
});

app.post('/groceryl', function(req,res){
	//console.log(Object.keys(req.body).length);
	//console.log(req.body);
	//create array of recipes
	var recipes = new Array();	
	var ids = new Array();
	for(key in req.body){
		ids.push({_id:new ObjectId(key)});
	}
		mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('recipe', function(err, coll){
			coll.find({$or:ids}, function(err, cursor){				
				cursor.toArray(function(err,arr){
					//console.log(arr);					
					res.render('grocerylist', {recipes: arr, td:templateData});
				});
			});
			});
		});		
	//console.log(recipes);	
});



app.delete("/recipe/:id", function(req, res){
  var recipe_id = req.params['id'];
  if(recipe_id){
	mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('recipe', function(err, coll){
      coll.remove({_id:new ObjectId(recipe_id)}, function(err){
        res.redirect('/recipes');
      });
    });
    });
  } else {
    res.send(404);
  }
});


app.listen(port);
