
	var app = require('express')();
	var http = require('http').Server(app);
	var express = require('express');
	var MongoClient = require('mongodb').MongoClient;
	var mongoose = require('mongoose');
	var bodyParser = require('body-parser');
	var fs = require("fs");
	var csv = require("fast-csv");
	var moment = require('moment');
	var _ = require('lodash');
	var DecisionTree = require('decision-tree');
	//var obj = JSON.parse(fs.readFileSync('/Users/carolinapinzon/Desktop/export/estrato.geojson', 'utf8'));

	// Add headers
	app.use(function (req, res, next) {

	    // Website you wish to allow to connect
	    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

	    // Request methods you wish to allow
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	    // Request headers you wish to allow
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Token');

	    // Set to true if you need the website to include cookies in the requests sent
	    // to the API (e.g. in case you use sessions)
	    res.setHeader('Access-Control-Allow-Credentials', true);

	    // Pass to next layer of middleware
	    next();
	});

 
 	//Twitter-----------------------------------------------------------------------------------------
	/*var client = new Twitter({
	  	consumer_key: 'yTa9x8ePYPwuqzMhtFyjONS78',
		consumer_secret: '33qohwnrUH2ThGXluDlAVTxBXYHe8wtQRYz2lgs2GvXDv0Q1KX',
		access_token_key: '4494339867-jjDmNVKzBZ3mKRJrOhUQ6nTOCrDsnhl0mX3TCi0',
		access_token_secret: '0HefD9zIX5Y3N5wqUwYUM1k2JhrJWMHEvU1VapwZtzWFm'
	});*/

	//JSON support-------------------------------------------------------------------------------------
	// create application/x-www-form-urlencoded parser
	app.use(bodyParser.urlencoded({ extended: true }))
	// create application/json parser
	app.use(bodyParser.json())

	app.use(bodyParser.json({limit: '50mb'}));
	app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

	var dataTypes = ['Crimes', 'Police_Stations'];

	//Mongodb settup-----------------------------------------------------------------------------------
	//Mongodb Schema Definitions
	var dataSchema = mongoose.Schema({
	    point: Object,
	    timeB: Number,
	    timeE: Number,
	    value: String, 
	    type: Number
	});

	dataSchema.methods.giveDate = function () {
		var date = new Date(this.time);
		return date;
	}

	dataSchema.methods.giveType = function () {
		return dataTypes[this.type];
	}

	var Data = mongoose.model('Registro', dataSchema);

	var valueArraySchema = mongoose.Schema({
		type: Number,
		valueArray: Array
	});

	var ValueArray = mongoose.model('ValueArray', valueArraySchema);

	var userSchema = mongoose.Schema({
	    email: String,
	    password: String,
	    variables: [],
	    models: []
	});

	userSchema.methods.isUser = function (email, password, token) {
		return (email === this.email) && (password === this.password) && (token === this.ObjectID);
	}

	var User = mongoose.model('User', userSchema);

	var projectSchema = mongoose.Schema({
	    name: String,
	    description: String,
	    graphs: [String],
	    user_id: mongoose.Schema.Types.ObjectId,
	    variables: []
	});

	var Project = mongoose.model('Project', projectSchema);

	//Mongodb connection
	var url = 'mongodb://localhost:27017/horizondb';
	mongoose.connect(url);

	//URL definitions----------------------------------------------------------------------------------
	app.use(express.static('public'));

	app.get('/', function(req, res){
	  	res.send(':D');
	});

	app.get('/map/:type', function(req, res){
		console.log('datos',req.query.t,req.params.type);
		//Data.find({ 'type': req.params.type, 'time': { $gt: parseInt(req.query.t) - 86400000, $lt: parseInt(req.query.t) + 86400000 } },function (err, sensors) {
			Data.find({ 
				'type': parseInt(req.params.type),
				$or: [
					{
						'timeB': { 
							//$gt: 0
							$gt: parseInt(req.query.t) - 86400000 , 
							$lt: parseInt(req.query.t)
						}
					},{
						'timeB': 0
					},{
					$and: [
						{
							'timeB': {
								$lt: parseInt(req.query.t)
							}
						},{
							'timeE': 0
						}
					]}
				]
				
				/*{ 
					$gt: parseInt(req.query.t) - 86400000, 
					$lt: parseInt(req.query.t) + 86400000 
				}*/
			}, function (err, sensors) {
				if (err) {
					return console.error(err);
				}
				return res.send(sensors);
			});
	});

	app.get('/regions/:type', function(req, res){
		return res.send(obj);
	});

	app.post('/explore', function(req, res) {
		//prepareData(req,res);
		decisionTreev2(req, res);
	});

	app.post('/predict', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var lat = parseFloat(req.body.lat);
		var lng = parseFloat(req.body.lng);
		var index = parseInt(req.body.index);

		console.log(petitionsParameters[index]);
		var vector = _.clone(petitionsParameters[index].newVector);
		var i1 = lat - petitionsParameters[index].latLngDist,
			i2 = lat + petitionsParameters[index].latLngDist,
			j1 = lng - petitionsParameters[index].latLngDist,
			j2 = lng + petitionsParameters[index].latLngDist;
		var timeOpen = moment().valueOf();
		var timeOpenMinusRange = moment().add(petitionsParameters[index].numberDays,'d').valueOf();
		var functionType = 2;
		petitionsParameters[index].res = res;
		petitionsParameters[index].countSearchesDB = 0;
		petitionsParameters[index].countSearchesArray = 0;
		calculateVectorDT(vector,i1,i2,j1,j2,timeOpen,timeOpenMinusRange,index,functionType,1);
		//var classPredicted = petitionsParameters[index].dt.predict();
	});

	app.post('/remove', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var index = req.body.index;
		petitionsParameters[index] = null;

		res.send(JSON.stringify({
			"status": "ok"
		}));
	});

	app.post('/login', function(req, res) {
		if (!req.body) return res.sendStatus(400)

		var existingUserQuery = User.findOne({'email': req.body.email});
		existingUserQuery.exec(function (err, user) {
			if (err) return handleError(err);
			//User exists
			if (user) {
				console.log('passwords:', user.password, req.body.password);
				if (user.password === req.body.password) {
					res.send(JSON.stringify({
						"status": "ok",
						"token": user._id,
						"variables": user.variables
					}));
				}
			}
			//User does not exists
			else {
				res.send(JSON.stringify({"status": "nok"}));
			}
		});
	});

	app.post('/sign_up', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		console.log('/sign_up');
		res.setHeader('Content-Type', 'application/*+json');
		if (req.body.password1 !== req.body.password2 || !validateEmail(req.body.email)) {
			res.send(JSON.stringify({"status": "nok"}));
		}
		var existingUserQuery = User.findOne({'email': req.body.email});
		existingUserQuery.exec(function (err, user) {
			if (err) return handleError(err);
			//User exists
			if (user) {
				res.send(JSON.stringify({"status": "nok"}));
			}
			//User does not exists
			else {
				var user = new User({
				email: req.body.email,
				password: req.body.password1
				});
				user.save(function (err, element) {
	    			if (err) return console.log(err);
	    		});
				res.send(JSON.stringify({
					"status": "ok",
					"token": user._id,
					"variables": []
				}));
			}
		});
	});

	app.post('/add_variable', function(req, res) {
		console.log('/add_variable');
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);

		var variables = [];
		User.findById(_id, function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			if(user.variables == undefined) {
				user.variables = [];
			}
			variables = user.variables;
			var index = -1;
			_.each(variables,function(variable, indexX) {
				if(variable.name == req.body.variable.name) {
					index = indexX;
				}
			})
			console.log(index);
			if(index == -1) {
				variables.push(req.body.variable);
			}
			else {
				variables[index] = req.body.variable;
			}
			user.variables = variables;

			console.log(variables);
			User.update({_id: _id},{$set: {variables:variables}},function(err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			})
			/*user.save(function (err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			});*/
		});
	});

	app.post('/add_model', function(req, res) {
		console.log('/add_model');
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);

		var models = [];
		User.findById(_id, function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			if(user.models == undefined) {
				user.models = [];
			}
			models = user.models;
			models.push(req.body.model);

			User.update({_id: _id},{$set: {models:models}},function(err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			})
			/*user.save(function (err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			});*/
		});
	});

	app.post('/delete_variable/:variable_index', function(req, res) {
		console.log('/delete_variable');
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);

		var variables = [];
		User.findById(_id, function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			if(user.variables == undefined) {
				user.variables = [];
			}
			variables = user.variables;
			var index = parseInt(req.params.variable_index);
			variables.splice(index,1);

			console.log(variables);
			User.update({_id: _id},{$set: {variables:variables}},function(err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			})
			/*user.save(function (err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			});*/
		});
	});

	app.post('/delete_model/:model_index', function(req, res) {
		console.log('/delete_model');
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);

		var models = [];
		User.findById(_id, function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			if(user.models == undefined) {
				user.models = [];
			}
			models = user.models;
			var index = parseInt(req.params.model_index);
			models.splice(index,1);

			console.log(models);
			User.update({_id: _id},{$set: {models:models}},function(err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			})
			/*user.save(function (err) {
				if (err) return handleError(err);
				res.send(JSON.stringify({
					"status": "ok"
				}));
			});*/
		});
	});

	app.post('/refresh_info', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);

		User.findById(_id, function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			res.send(JSON.stringify({
				"status": "ok",
				"token": user._id,
				"variables": user.variables,
				"models": user.models
			}));
		});
	});

	app.post('/new_project', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);
		var existingUserQuery = User.findOne({'_id': _id});
		existingUserQuery.exec(function (err, user) {
			if (err) return handleError(err);
			console.log(user);
			//User exists
			if (user) {
				var project = new Project({
					name: req.body.name,
					description: req.body.description,
					graphs: [],
					user_id: _id
				});
				project.save(function (err, element) {
	    			if (err) return console.log(err);
	    		});
				res.send(JSON.stringify({
					"status": "ok",
					"project_id": project._id
				}));
			}
			//User does not exists
			else {
				res.send(JSON.stringify({
					"status": "nok"
				}));
			}
		});
	});

	app.post('/update_project', function(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(req.body.project_id);
		var existingProjectQuery = Project.findOne({'_id': _id});
		existingProjectQuery.exec(function (err, project) {
			if (err) return handleError(err);
			//User exists
			if (project) {
				var isOwner = project.user_id == headers.token;
				if (isOwner) {
					console.log('before update');
					var updateQuery = Project.update({
						_id: _id
					},{
						name: req.body.name,
						description: req.body.description,
						graphs: req.body.graphs
					},{ 
						multi: false 
					});
					updateQuery.exec(function (err, project) {
						console.log(project);
						res.send(JSON.stringify({
							"status": "ok"
						}));
					});
				}
				else {
					res.send(JSON.stringify({
						"status": "nok"
					}));
				}
			}
			//User does not exists
			else {
				res.send(JSON.stringify({
					"status": "nok"
				}));
			}
		});
	});

	app.get('/project_details/:project_id', function(req, res) {
		res.setHeader('Content-Type', 'application/*+json');
		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(req.params.project_id);
		var existingProjectQuery = Project.findOne({'_id': _id});
		existingProjectQuery.exec(function (err, project) {
			if (err) return handleError(err);
			//User exists
			if (project) {
				var isOwner = project.user_id == headers.token;
				res.send(JSON.stringify({
					"status": "ok",
					project: {
						name: project.name,
						description: project.description,
						graphs: project.graphs
					},
					isOwner: isOwner
				}));
			}
			//User does not exists
			else {
				res.send(JSON.stringify({
					"status": "nok"
				}));
			}
		});
	});


	app.get('/projects_list', function(req, res) {
		res.setHeader('Content-Type', 'application/*+json');

		var headers = req.headers;
		var ObjectId = mongoose.Types.ObjectId;
		var _id = new ObjectId(headers.token);
		var existingUserQuery = User.findOne({'_id': _id});
		existingUserQuery.exec(function (err, user) {
			if (err) return handleError(err);
			//User exists
			if (user) {
				var projectsQuery = Project.find({"user_id": _id});
				projectsQuery.exec(function (err, projects) {
					if (err) return handleError(err);
					if (projects) {
						var projects_list = [];
						for (var i = 0; i < projects.length; i++) {
							var projectInfo = {
								id: projects[i]._id,
								name: projects[i].name,
								description: projects[i].description,
								graphs: projects[i].graphs
							};
							projects_list.push(projectInfo);
						}
						res.send(JSON.stringify({
							"status": "ok",
							"projects_list": projects_list
						}));
					}
					else {
						res.send(JSON.stringify({
							"status": "ok"
						}));
					}
				});
			}
			//User does not exists
			else {
				res.send(JSON.stringify({
					"status": "nok"
				}));
			}
		});
		
	});

	//Validate email function
	function validateEmail(email) {
	    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(email);
	}

	var saveCSVData = function(type,file) {
		var valueArray = [];

		//Connect to database
		MongoClient.connect(url, function(err, db) {
			if (err) {
 		 		console.log('Error connecting client');
 		 	}

		  	//Read CSV
			var stream = fs.createReadStream(file);
			var i = 0;
			var prev = 0;

			var csvStream = csv()
		    .on("data", function(data){
		    	//console.log(i);
		    	/*if (parseInt(i/10000) !== prev) {
		    		console.log(i);
		    		prev = parseInt(i/10000);
		    	}*/
		    	if (i !== 0) {
		    		var time = data[0];
			    	var lat = data[1];
				    var lng = data[2];
				    var value = data[3];
				    var index = -1;
				    /*index = _.findIndex(valueArray, function(t) {
			    		return t == value;
			    	});
			    	if (index === -1) {
			    		index = valueArray.length;
			    		valueArray.push(value);
			    	}*/
			    	if(!isNaN(value)) {
			    		value = parseInt(value);
			    	}
			    	db.collection('registros').insertOne({
						"timeB": parseInt(time),
						"timeE": parseInt(time),
						"lat": parseFloat(lat),
						"lng": parseFloat(lng),
						"value": value,
						"type": parseInt(type)
				    }, function(e,r) {
				    	if (e) {
				    		if (prev !== 'error') {
				    			console.log('error: ', i);
				    			prev = 'error';
				    		}
				    	}
				    });
		    	}
			    i ++;
		    })
		    .on("end", function(){
		    	//Save or update array value
		        console.log("done: " + file,i);
		    });
		 
			stream.pipe(csvStream);
		});
	}

	function formatCSV(number) {

		var stream = fs.createReadStream("/Users/carolinapinzon/Desktop/DataTwitter/csv/" + number + "_output.csv");
		var i = 0;
		var prev = 0;
		var initial = 1420174799999;
		var cantPerDay = 0;


		//var writer = csvWriter({ headers: ["time", "lat", "lng", "value"]});
		//writer.pipe(fs.createWriteStream(file + '.csv'));
		var y = 'mongo tesisdb --eval \'db.registros.insert([';

		var streamsh = fs.createWriteStream("twitter" + number + ".sh");
		streamsh.once('open', function(fd) {

			var csvStream = csv()
		    .on("data", function(data){
		    	if (parseInt(i/1000) !== prev) {
		    		console.log(i);
		    		prev = parseInt(i/1000);
		    		y = y.substring(0,y.length - 1);
		    		y = y + ']);\'\n';
		    		streamsh.write(y);
		    		y = 'mongo tesisdb --eval \'db.registros.insert([';
		    	}
		    	else {
		    		var lat = data[6];
					var lng = data[7];
					if (lat !== '' && lat != undefined && i !== 0) {
						//var date = moment(data[8]).add(1, 'y');
						//date = date.valueOf();
						date = initial;
						var value = Math.ceil(Math.random()*5);
						y = y + '{"type":1,"timeB":' + date + ',"timeE":' + date + ',"value":' + value + ',"point":{"type":"Point","coordinates":[' + lat + ',' + lng + ']}},'
						//var y = 'mongo tesisdb --eval \'db.registros.insert();\'\n';
						//streamsh.write(y);
					}
		    	}
		    	
				i ++;
				if(cantPerDay > 900) {
					cantPerDay = 0;
					var date = moment(initial).add(1, 'd');
					initial = date.valueOf();
				}
				else {
					cantPerDay++;
				}
		    })
		    .on("end", function(){
		        console.log("done: " + number);

				streamsh.end();
				//writer.end();
		    });
		 
			stream.pipe(csvStream);

		});
	}

	//Open port----------------------------------------------------------------------------------------
	http.listen(8087, function(){
	  	console.log('listening on *:8087');
	});

	var petitionsParameters = [];

	function decisionTreev2(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var numberSuggestions = req.body.numberSuggestions;
		var latLngDist = req.body.radius/100*0.001;
		var weights = req.body.weights;
		var otherContextVariables = req.body.otherContextVariables;
		var accuracy;
		var numberDays = -1*parseInt(req.body.time);
		var sugestionClass = req.body.sugestionClass;
		var candidates = req.body.candidates;

		var keys = [{
			key:'estrato',
			values: [1,2,3,4,5,6]
		},{
			key:'crimenes',
			values: ['Robo','Hurto','Vandalismo','Asesinato','Fraude']
		},{
			key:'transmilenio',
			values: ['Cabecera','Intermedia','Intercambio','Sencilla']
		},{
			key:'cines',
			values: [0]
		},{
			key:'universidades',
			values: [0]
		},{
			key:'bomberos',
			values: [0]
		}];

		var newVector = {};
		var features = [];
		_.each(keys,function(key,index){
			if(weights[index] > 0) {
				_.each(key.values,function(value){
					features.push(key.key + value);
					newVector[key.key + value] = 0;
				})
			}
		});

		var petitionsParametersCurrent = {
			points: points,
			radius: radius,
			latLngDist: latLngDist,
			weights: weights,
			otherContextVariables: otherContextVariables,
			numberDays: numberDays,
			features: features,
			keys: keys,
			countSearchesDB: 0,
			countSearchesArray: 0,
			training_data: [],
			test_data: [],
			newVector: newVector,
			res: res,
			sugestionClass: sugestionClass,
			candidates: candidates
		}

		var oneNull = false;
		var indexPetitionsParameters;
		for (var i = 0; i < petitionsParameters.length && !oneNull; i++) {
			if(petitionsParameters[i] == null) {
				oneNull = true;
				indexPetitionsParameters = i;
			}
		}
		if(oneNull) {
			petitionsParameters[indexPetitionsParameters] = petitionsParametersCurrent;
		}
		else {
			indexPetitionsParameters = petitionsParameters.length;
			petitionsParameters.push(petitionsParametersCurrent);
		}
		startCreation(indexPetitionsParameters);
	}

	function startCreation(index) {
		console.log('init:' + moment().valueOf());
		process.stdout.write('Explore');

		_.each(petitionsParameters[index].points, function(point,indexP) {
			var vector = _.clone(petitionsParameters[index].newVector);
			//console.log(point);
			vector.valor = point.valor;

			if(indexP < 0.7*petitionsParameters[index].points.length){
				petitionsParameters[index].training_data.push(vector);
			}
			else {
				petitionsParameters[index].test_data.push(vector);
			}

			var latLngDist = point.radius/100*0.001;
			var i1 = point.point.coordinates[0] - latLngDist,
				i2 = point.point.coordinates[0] + latLngDist,
				j1 = point.point.coordinates[1] - latLngDist,
				j2 = point.point.coordinates[1] + latLngDist;

			var timeOpen = parseInt(point.timeB);
			var timeOpenMinusRange = moment(timeOpen).add(petitionsParameters[index].numberDays,'d').valueOf();

			calculateVectorDT(vector,i1,i2,j1,j2,timeOpen,timeOpenMinusRange,index,1,petitionsParameters[index].points.length);
		});
	}

	function createTree(index) {

		_.each(petitionsParameters[index].features,function(feature){
			_.each(petitionsParameters[index].training_data,function(data){
				if(data[feature] == undefined) {
					data[feature] = 0;
				}
			})
			_.each(petitionsParameters[index].test_data,function(data){
				if(data[feature] == undefined) {
					data[feature] = 0;
				}
			})
		})
		var class_name = "valor";

		petitionsParameters[index].dt = new DecisionTree(petitionsParameters[index].training_data, class_name, petitionsParameters[index].features);
		petitionsParameters[index].accuracy = petitionsParameters[index].dt.evaluate(petitionsParameters[index].test_data);
		var contTruePrediction = 0;
		_.each(petitionsParameters[index].test_data,function(test_data){
			var classPredicted = parseInt(petitionsParameters[index].dt.predict(test_data));
			var realClass = parseInt(test_data.valor);
			if(classPredicted == 1 || classPredicted == 5) {
				if(classPredicted == realClass) {
					contTruePrediction ++;
				}
			}
			else {
				if(classPredicted == 2) {
					if(classPredicted == realClass || classPredicted == realClass + 1) {
						contTruePrediction++;
					}
				}
				else if(classPredicted == 3) {
					if(classPredicted == realClass || classPredicted == realClass + 1 || classPredicted == realClass - 1) {
						contTruePrediction++;
					}
				}
				else {
					if(classPredicted == realClass || classPredicted == realClass - 1) {
						contTruePrediction++;
					}
				}
			}
		})

		petitionsParameters[index].accuracy == contTruePrediction/petitionsParameters[index].test_data.length;

		cityDiscretization(index);
	}

	function cityDiscretization(index) {

		petitionsParameters[index].countSearchesDBCityDiscretization = 0;
		petitionsParameters[index].countSearchesArrayCityDiscretization = 0;

		//Calculate Vectors for the map discretization
		var bogotaLngDist = -74.007410 - -74.201731,
			bogotaLngI = -74.201731,
			bogotaLngF = -74.007410,
			bogotaLatDist = 4.760621 - 4.533741,
			bogotaLatI = 4.533741,
			bogotaLatF = 4.760621;
		var diffLng = petitionsParameters[index].latLngDist*2,
			diffLat = petitionsParameters[index].latLngDist*2;

		var timeOpen = moment().valueOf();
		var timeOpenMinusRange = moment().add(petitionsParameters[index].numberDays,'d').valueOf();

		var newVector = {};
		_.each(petitionsParameters[index].features,function(feature){
			newVector[feature] = 0;
		});

		var max = Math.ceil((bogotaLatF-bogotaLatI)/diffLat)*Math.ceil((bogotaLngF-bogotaLngI)/diffLat);

		process.stdout.write('City Discretization');

		petitionsParameters[index].vectors = [];

		var search = {
			'timeB': {
				'$gt': timeOpenMinusRange,
				'$lt': timeOpen
			}, 'type': 1
		};

		Data.find(search).lean().exec(function(err, registros) {
			var contVectors = 0;
			for (var i = bogotaLatI; i < bogotaLatF; i += diffLat) {
				for (var j = bogotaLngI; j < bogotaLngF; j += diffLng) {
					petitionsParameters[index].countSearchesDBCityDiscretization ++;
					process.stdout.write('.');
					var i2 = i + diffLat,
						j2 = j + diffLat;
					var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
						return vectorP.i1 == i && vectorP.j1 == j;
					})
					if(vector.length == 0) {
						var vectorCloned  = _.clone(newVector);
						vector = {
							vector: vectorCloned,
							i1: i,
							i2: i2,
							j1: j, 
							j2: j2
						};
						petitionsParameters[index].vectors.push(vector);
					}
					else {
						vector = vector[0];
						//var vector = petitionsParameters[index].vectors[contVectors].vector;
					}
					_.each(registros,function(registro){
						if(petitionsParameters[index].weights[registro.type] > 0){
							var lat = registro.point.coordinates[0],
								lng = registro.point.coordinates[1];
							if(i <= lat && i2 >= lat && j <= lng && j2 >= lng) {
								vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
							}
						}
					});
					var i1 = i + diffLat/2,
						i2 = i1 + diffLat,
						j1 = j + diffLat/2,
						j2 = j1 + diffLat;
					var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
						return vectorP.i1 == i1 && vectorP.j1 == j1;
					})
					if(vector.length == 0) {
						var vectorCloned  = _.clone(newVector);
						vector = {
							vector: vectorCloned,
							i1: i1,
							i2: i2,
							j1: j1, 
							j2: j2
						};
						petitionsParameters[index].vectors.push(vector);
					}
					else {
						vector = vector[0];
						//var vector = petitionsParameters[index].vectors[contVectors].vector;
					}
					_.each(registros,function(registro){
						if(petitionsParameters[index].weights[registro.type] > 0){
							var lat = registro.point.coordinates[0],
								lng = registro.point.coordinates[1];
							if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
								vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
							}
						}
					});
					if(petitionsParameters[index].countSearchesDBCityDiscretization == 2*max && petitionsParameters[index].countSearchesArrayCityDiscretization == 2*max*petitionsParameters[index].otherContextVariables.length) {
						console.log('done');
						analyzeDiscretization(index);
					}
				}
			}
		});

		var search2 = { 
			'timeE': 0,
			'timeB': { '$lt': timeOpen }
		};

		Data.find(search2).lean().exec(function(err, registros) {
			var contVectors = 0;
			for (var i = bogotaLatI; i < bogotaLatF; i += diffLat) {
				for (var j = bogotaLngI; j < bogotaLngF; j += diffLng) {
					petitionsParameters[index].countSearchesDBCityDiscretization ++;
					process.stdout.write('.');
					var i2 = i + diffLat,
						j2 = j + diffLat;
					var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
						return vectorP.i1 == i && vectorP.j1 == j;
					})
					if(vector.length == 0) {
						var vectorCloned  = _.clone(newVector);
						vector = {
							vector: vectorCloned,
							i1: i,
							i2: i2,
							j1: j, 
							j2: j2
						};
						petitionsParameters[index].vectors.push(vector);
					}
					else {
						vector = vector[0];
						//var vector = petitionsParameters[index].vectors[contVectors].vector;
					}
					_.each(registros,function(registro){
						if(petitionsParameters[index].weights[registro.type] > 0){
							if(registro.point.type == 'Point') {
								var lat = registro.point.coordinates[0],
									lng = registro.point.coordinates[1];
								if(i <= lat && i2 >= lat && j <= lng && j2 >= lng) {
									vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
								}
							}
							else {
								var cont = true;
								for (var k = 0; k < registro.point.coordinates[0][0].length && cont; k++) {
									var lat = registro.point.coordinates[0][k][0],
										lng = registro.point.coordinates[0][k][1];
									if(i <= lat && i2 >= lat && j <= lng && j2 >= lng) {
										cont = false;
										vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
									}
								}
							}
						}
					});
					var i1 = i + diffLat/2,
						i2 = i1 + diffLat,
						j1 = j + diffLat/2,
						j2 = j1 + diffLat;
					var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
						return vectorP.i1 == i1 && vectorP.j1 == j1;
					})
					if(vector.length == 0) {
						var vectorCloned  = _.clone(newVector);
						vector = {
							vector: vectorCloned,
							i1: i1,
							i2: i2,
							j1: j1, 
							j2: j2
						};
						petitionsParameters[index].vectors.push(vector);
					}
					else {
						vector = vector[0];
						//var vector = petitionsParameters[index].vectors[contVectors].vector;
					}
					_.each(registros,function(registro){
						if(petitionsParameters[index].weights[registro.type] > 0){
							if(registro.point.type == 'Point') {
								var lat = registro.point.coordinates[0],
									lng = registro.point.coordinates[1];
								if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
									vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
								}
							}
							else {
								var cont = true;
								for (var k = 0; k < registro.point.coordinates[0][0].length && cont; k++) {
									var lat = registro.point.coordinates[0][k][0],
										lng = registro.point.coordinates[0][k][1];
									if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
										cont = false;
										vector.vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
									}
								}
							}
						}
					});
					//console.log(petitionsParameters[index].countSearchesDBCityDiscretization, 2*max, petitionsParameters[index].countSearchesArrayCityDiscretization, 2*max*petitionsParameters[index].otherContextVariables.length);
					if(petitionsParameters[index].countSearchesDBCityDiscretization == 2*max && petitionsParameters[index].countSearchesArrayCityDiscretization == 2*max*petitionsParameters[index].otherContextVariables.length) {
						console.log('done');
						analyzeDiscretization(index);
					}
				}
			}
		});

		var contVectors = 0;
		for (var i = bogotaLatI; i < bogotaLatF; i += diffLat) {
			for (var j = bogotaLngI; j < bogotaLngF; j += diffLng) {
				process.stdout.write('.');
				var i2 = i + diffLat,
					j2 = j + diffLat;
				var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
					return vectorP.i1 == i && vectorP.j1 == j;
				})
				if(vector.length == 0) {
					var vectorCloned  = _.clone(newVector);
					vector = {
						vector: vectorCloned,
						i1: i,
						i2: i2,
						j1: j, 
						j2: j2
					};
					petitionsParameters[index].vectors.push(vector);
				}
				else {
					vector = vector[0];
				}
				_.each(petitionsParameters[index].otherContextVariables, function(contextVariable) {
					petitionsParameters[index].countSearchesArrayCityDiscretization ++;
					if(contextVariable.weight > 0) {
						var points = _.filter(contextVariable.points, function(point) {
							var isInsideSpace = i <= point.lat && i2 >= point.lat && j <= point.lng && j2 >= point.lng;
							var isInsideTime = (point.timeB <= timeOpen && point.timeE == 0) || (point.timeB >= timeOpenMinusRange && point.timeB <= timeOpen);
							return isInsideSpace && isInsideTime;
						});
						_.each(points,function(point){
							var key = contextVariable.name + point.value;
							vector.vector[key] ++;
						})
						if(petitionsParameters[index].countSearchesDBCityDiscretization == 2*max && petitionsParameters[index].countSearchesArrayCityDiscretization == 2*max*petitionsParameters[index].otherContextVariables.length) {
							console.log('done');
							analyzeDiscretization(index);
						}
					}
				})
				var i1 = i + diffLat/2,
					i2 = i1 + diffLat,
					j1 = j + diffLat/2,
					j2 = j1 + diffLat;
				var vector = _.filter(petitionsParameters[index].vectors,function(vectorP){
					return vectorP.i1 == i1 && vectorP.j1 == j1;
				})
				if(vector.length == 0) {
					var vectorCloned  = _.clone(newVector);
					vector = {
						vector: vectorCloned,
						i1: i1,
						i2: i2,
						j1: j1, 
						j2: j2
					};
					petitionsParameters[index].vectors.push(vector);
				}
				else {
					vector = vector[0];
				}
				_.each(petitionsParameters[index].otherContextVariables, function(contextVariable) {
					petitionsParameters[index].countSearchesArrayCityDiscretization ++;
					if(contextVariable.weight > 0) {
						var points = _.filter(contextVariable.points, function(point) {
							var isInsideSpace = i1 <= point.lat && i2 >= point.lat && j1 <= point.lng && j2 >= point.lng;
							var isInsideTime = (point.timeB <= timeOpen && point.timeE == 0) || (point.timeB >= timeOpenMinusRange && point.timeB <= timeOpen);
							return isInsideSpace && isInsideTime;
						});
						_.each(points,function(point){
							var key = contextVariable.name + point.value;
							vector.vector[key] ++;
						})
						
						if(petitionsParameters[index].countSearchesDBCityDiscretization == 2*max  && petitionsParameters[index].countSearchesArrayCityDiscretization == 2*max*petitionsParameters[index].otherContextVariables.length) {
							console.log('done');
							analyzeDiscretization(index);
						}
					}
				})
			}
		}

		//Calculate Vectors for each candidate

		petitionsParameters[index].countSearchesDB = 0;
		petitionsParameters[index].countSearchesArray = 0;


		petitionsParameters[index].candidatesResult = [];
		_.each(petitionsParameters[index].candidates, function(point,indexP) {
			//console.log(point)
			var vector = _.clone(petitionsParameters[index].newVector);
			vector.valor = point.value;

			if(indexP < 0.7*petitionsParameters[index].points.length){
				petitionsParameters[index].training_data.push(vector);
			}
			else {
				petitionsParameters[index].test_data.push(vector);
			}

			var i1 = point.lat - petitionsParameters[index].latLngDist,
				i2 = point.lat + petitionsParameters[index].latLngDist,
				j1 = point.lng - petitionsParameters[index].latLngDist,
				j2 = point.lng + petitionsParameters[index].latLngDist;

			var max = petitionsParameters[index].candidates.length;

			petitionsParameters[index].candidatesResult.push({
				vector: vector,
				i1: i1,
				i2: i2,
				j1: j1,
				j2: j2
			})

			calculateVectorDT(vector,i1,i2,j1,j2,timeOpen,timeOpenMinusRange,index,2,max);
		});

	}

	function analyzeDiscretization(index) {
		if(petitionsParameters[index].analyzeDiscretization == undefined) {
			console.log('Analyze Discretization 1');
			petitionsParameters[index].analyzeDiscretization = true;
		}
		else {//Search Finished
			console.log('Analyze Discretization 2');
			process.stdout.write('Analyze Discretization'); 
			petitionsParameters[index].suggestions = [];
			petitionsParameters[index].suggestions4 = [];
			petitionsParameters[index].suggestions3 = [];
			petitionsParameters[index].suggestions2 = [];
			petitionsParameters[index].suggestions1 = [];
			_.each(petitionsParameters[index].vectors, function(vector) {
				process.stdout.write('.'); 
				var sum = 0;
				//console.log(vector);
				_.each(petitionsParameters[index].features,function(feature){
					sum += vector.vector[feature];
				});
				if (sum != 0) {
					var classPredicted = petitionsParameters[index].dt.predict(vector.vector);
					//console.log(classPredicted);
					if(classPredicted == '5') {
						vector.sum = sum;
						petitionsParameters[index].suggestions.push(vector);
					}
					else if(classPredicted == '4') {
						vector.sum = sum;
						petitionsParameters[index].suggestions4.push(vector);
					}
					else if(classPredicted == '3') {
						vector.sum = sum;
						petitionsParameters[index].suggestions3.push(vector);
					}
					else if(classPredicted == '2') {
						vector.sum = sum;
						petitionsParameters[index].suggestions2.push(vector);
					}
					else if(classPredicted == '1') {
						vector.sum = sum;
						petitionsParameters[index].suggestions1.push(vector);
					}
				}
			})
			console.log('done'); 
			_.each(petitionsParameters[index].candidatesResult, function(candidate){
				candidate.classPredicted = petitionsParameters[index].dt.predict(candidate.vector);
			})

			orderSuggestions(index);
		}
		
		
	}

	function orderSuggestions(index) {
		process.stdout.write('Ordering Suggestions'); 

		var suggestionsWithoutPriority = [];
		var suggestionsWithPriority = [];

		_.each(petitionsParameters[index].suggestions,function(suggestion){
			process.stdout.write('.'); 
			var hasPriority = false;
			_.each(petitionsParameters[index].keys,function(key,indexK){
				if(petitionsParameters[index].weights[indexK] == 1) {
					_.each(key.values,function(value){
						var keyF = key.key + value;
						hasPriority = hasPriority || suggestion.vector[keyF] > 0;
					})
				}
			});
			if(hasPriority){
				suggestionsWithPriority.push(suggestion);
			}
			else {
				suggestionsWithoutPriority.push(suggestion);
			}
		});
		console.log('done');

		suggestionsWithPriority = _.sortBy(suggestionsWithPriority, function(suggestion) {
			return -suggestion.sum;
		})
		suggestionsWithoutPriority = _.sortBy(suggestionsWithoutPriority, function(suggestion) {
			return -suggestion.sum;
		})

		var sugerenciasFinal = suggestionsWithPriority.concat(suggestionsWithoutPriority);
		
		//spetitionsParameters[index] = null;
		/*petitionsParameters = _.remove(petitionsParameters,function(parameters,indexP){
			return indexP == index;
		});*/

		petitionsParameters[index].res.send(JSON.stringify({
			"status": "ok",
			"suggestions": suggestionsWithPriority,
			"secundarySuggestions": suggestionsWithoutPriority,
			"candidatesResult": petitionsParameters[index].candidatesResult,
			"accuracy": petitionsParameters[index].accuracy,
			"index": index,
			"suggestions4": petitionsParameters[index].suggestions4,
			"suggestions3": petitionsParameters[index].suggestions3,
			"suggestions2": petitionsParameters[index].suggestions2,
			"suggestions1": petitionsParameters[index].suggestions1
		}));

	}

	function calculateVectorDT(vector,i1,i2,j1,j2,timeOpen,timeOpenMinusRange,index,functionType,max) {
		var search = {
			'timeB': {
				'$gt': timeOpenMinusRange,
				'$lt': timeOpen
			}, 'type': 1
		};
		Data.find(search).lean().exec(function(err, registros) {
			process.stdout.write('.');
			petitionsParameters[index].countSearchesDB ++;
			_.each(registros,function(registro){
				if(petitionsParameters[index].weights[registro.type] > 0){
					var lat = registro.point.coordinates[0],
						lng = registro.point.coordinates[1];
					if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
						vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
					}
				}
			});
			//console.log(petitionsParameters[index].countSearchesDB,2*max,petitionsParameters[index].countSearchesArray,max*petitionsParameters[index].otherContextVariables.length)
			if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
				console.log('done');
				if(functionType == 1) {
					createTree(index);
				}
				else {
					analyzeDiscretization(index);
				}
			}
		});

		var search2 = { 
			'timeE': 0,
			'timeB': { '$lt': timeOpen }
		};

		Data.find(search2).lean().exec(function(err, registros) {
			process.stdout.write('.');
			petitionsParameters[index].countSearchesDB ++;
			_.each(registros,function(registro){
				if(petitionsParameters[index].weights[registro.type] > 0){
					if(registro.point.type == 'Point') {
						var lat = registro.point.coordinates[0],
							lng = registro.point.coordinates[1];
						if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
							vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
						}
					}
					else {
						var cont = true;
						for (var i = 0; i < registro.point.coordinates[0][0].length && cont; i++) {
							var lat = registro.point.coordinates[0][i][0],
								lng = registro.point.coordinates[0][i][1];
							if(i1 <= lat && i2 >= lat && j1 <= lng && j2 >= lng) {
								cont = false;
								vector[petitionsParameters[index].keys[registro.type].key + registro.value] ++;
							}
						}
					}
				}
			});
			//console.log(petitionsParameters[index].countSearchesDB,2*max,petitionsParameters[index].countSearchesArray,max*petitionsParameters[index].otherContextVariables.length)
			if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
				console.log('done');
				if(functionType == 1) {
					createTree(index);
				}
				else {
					console.log('done');
					analyzeDiscretization(index);
				}
			}
		});

		//Buscar en variables de contexto adicionadas por usuario
		_.each(petitionsParameters[index].otherContextVariables, function(contextVariable) {
			petitionsParameters[index].countSearchesArray ++;
			if(contextVariable.weight > 0) {
				var points = _.filter(contextVariable.points, function(point) {
					var isInsideSpace = i1 <= point.lat && i2 >= point.lat && j1 <= point.lng && j2 >= point.lng;
					var isInsideTime = (point.timeB <= timeOpen && point.timeE == 0) || (point.timeB >= timeOpenMinusRange && point.timeB <= timeOpen);
					return isInsideSpace && isInsideTime;
				});
				_.each(points,function(point){
					var key = contextVariable.name + point.value;
					if(functionType == '1') {
						var existingFeature = _.filter(petitionsParameters[index].features, function(feature) {
							return feature == key;
						});
						if(existingFeature.length == 0) {
							petitionsParameters[index].features.push(key);
						}
						if (vector[key] == undefined) {
							vector[key] = 1;
						}
						else {
							vector[key] ++;
						}
					}
					else {
						vector[key] ++;
					}
				})

				//console.log(petitionsParameters[index].countSearchesDB,2*max,petitionsParameters[index].countSearchesArray,max*petitionsParameters[index].otherContextVariables.length)
				if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
					console.log('done');
					if(functionType == 1) {
						createTree(index);
					}
					else {
						analyzeDiscretization(index);
					}
				}
			}
		})
	}

	function decisionTree(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		var weights = req.body.weights;
		var accuracy;
		//lng 100m = 0.001
		//lat 100m = 0.001
		Data.find(function(err, registros) {

			var max = 0;

			var training_data =[];
			var test_data = []
			_.each(points, function(point,index){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				//console.log(pointsInside.length);
				var cont = [0,0,0,0,0,0,point.value]
				/*if (parseInt(point.value)>= max) {
					max = parseInt(point.value);
				}*/
				_.each(pointsInside, function(pointInside) {
					if(parseFloat(weights[pointInside.type]) > 0) {
						cont[pointInside.type] ++;
					}
				})
				//pointsCluster.push(cont);
				//console.log(cont);
				var objectCont = {
					"c0": cont[0],
					"c1": cont[1],
					"c2": cont[2],
					"c3": cont[3],
					"c4": cont[4],
					"c5": cont[5],
					"valor": point.value
				}
				if(index/points.length <= 0.7) {
					training_data.push(objectCont);
				}
				else {
					test_data.push(objectCont);
				}

			});
			var class_name = "valor";
			var features = ["c0","c1", "c2", "c3", "c4", "c5"];
			var dt = new DecisionTree(training_data, class_name, features);
			_.each(test_data,function(data){

			})
			accuracy = dt.evaluate(test_data);
			//console.log('accuracy',accuracy);

			//console.log(max);
			var treeModel = dt.toJSON();
			//console.log(treeModel);
			var bogotaLngDist = -74.007410 - -74.201731,
				bogotaLngI = -74.201731,
				bogotaLngF = -74.007410,
				bogotaLatDist = 4.760621 - 4.533741,
				bogotaLatI = 4.533741,
				bogotaLatF = 4.760621;
			var diffLng = latLngDist*2,
				diffLat = latLngDist*2;
			//console.log(bogotaLngI,bogotaLngF,diffLng);
			var min = -1;
			var coordinates = [];
			var sugerencias = [];
			for (var i = bogotaLngI; i < bogotaLngF; i += diffLng) {
				for (var j = bogotaLatI; j < bogotaLatF; j += diffLat) {
					var iP = i;
					var jP = j;
					var i2 = iP+diffLat;
					var j2 = jP+diffLng;

					var pointsInside = _.filter(registros, function(registro) {
						return registro.lat >= jP && registro.lat <= j2 && registro.lng >= iP && registro.lng <= i2;
					});
					//console.log(pointsInside);
					var cont = [0,0,0,0,0,0]
					_.each(pointsInside, function(pointInside) {
						if(parseFloat(weights[pointInside.type]) > 0) {
							cont[pointInside.type] ++;
						}
					})
					var sumaCont = cont[0] + cont[1] + cont[2] + cont[3] + cont[4] + cont[5];
					var objectCont = {
						"c0": cont[0],
						"c1": cont[1],
						"c2": cont[2],
						"c3": cont[3],
						"c4": cont[4],
						"c5": cont[5]
					}
					var prediction = dt.predict(objectCont)
					if (prediction == 'CLASS2' && sumaCont > 0) {
						var existingPoints = _.filter(points, function(point) {
							return point.lat >= j && point.lat <= j2 && point.lng >= i && point.lng <= i2;
						});
						//existingPoints = [];
						if(existingPoints.length == 0) {
							var sugerencia = {
								lat: (j+j2)/2,
								lng: (i+i2)/2,
								cont: objectCont,
								sum: sumaCont
							};
							//console.log(existingPoints,objectCont,dt.predict(objectCont));
							sugerencias.push(sugerencia);
						}
					}

					iP = i + latLngDist*2;
					jP = j + latLngDist*2;
					i2 = iP+diffLat;
					j2 = jP+diffLng;


					var pointsInside = _.filter(registros, function(registro) {
						return registro.lat >= jP && registro.lat <= j2 && registro.lng >= iP && registro.lng <= i2;
					});
					//console.log(pointsInside);
					var cont = [0,0,0,0,0,0]
					_.each(pointsInside, function(pointInside) {
						if(parseFloat(weights[pointInside.type]) > 0) {
							cont[pointInside.type] ++;
						}
					})
					var sumaCont = cont[0] + cont[1] + cont[2] + cont[3] + cont[4] + cont[5];
					var objectCont = {
						"c0": cont[0],
						"c1": cont[1],
						"c2": cont[2],
						"c3": cont[3],
						"c4": cont[4],
						"c5": cont[5]
					}
					var prediction = dt.predict(objectCont)
					if (prediction == '5' && sumaCont > 0) {
						var existingPoints = _.filter(points, function(point) {
							return point.lat >= j && point.lat <= j2 && point.lng >= i && point.lng <= i2;
						});
						//existingPoints = [];
						if(existingPoints.length == 0) {
							var sugerencia = {
								lat: (j+j2)/2,
								lng: (i+i2)/2,
								cont: objectCont,
								sum: sumaCont
							};
							//console.log(existingPoints,objectCont,dt.predict(objectCont));
							sugerencias.push(sugerencia);
						}
					}
					//console.log(distancia,min);
				}
			}
			console.log('sugerencias',sugerencias.length,sugerencias);
			var sugerenciasConPrioridad = [];
			var sugerenciasSinPrioridad = [];
			_.each(sugerencias, function(sugerencia) {
				var esSugerenciasPrioridad = false;
				_.each(weights,function(weight,indexW) {
					var key = 'c' + indexW;
					var booleanPrioridad = weight == 1 && sugerencia.cont[key] > 0;
					esSugerenciasPrioridad = esSugerenciasPrioridad || booleanPrioridad;
					console.log(weight,sugerencia.cont[key],booleanPrioridad);
				})
				if(esSugerenciasPrioridad) {
					sugerenciasConPrioridad.push(sugerencia);
				}
				else {
					sugerenciasSinPrioridad.push(sugerencia);
				}
			})

			sugerenciasConPrioridad = _.sortBy(sugerenciasConPrioridad,function(sugerencia) {
				return -sugerencia.sum;
			});

			sugerenciasSinPrioridad = _.sortBy(sugerenciasSinPrioridad,function(sugerencia) {
				return -sugerencia.sum;
			});

			sugerencias = sugerenciasConPrioridad.concat(sugerenciasSinPrioridad);
			console.log('sugerenciasConPrioridad',sugerenciasConPrioridad.length,sugerenciasConPrioridad);
			console.log('sugerenciasSinPrioridad',sugerenciasSinPrioridad.length,sugerenciasSinPrioridad);
			res.send(JSON.stringify({
				"status": "ok",
				"suggestions": sugerencias.slice(0,numberSuggestions),
				"accuracy": accuracy
			}));

		});
	}

	function prepareData(req,res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		var weights = req.body.weights;
		
		Data.find(function(err, registros) {

			var max = 0;

			var training_data =[];
			var test_data = [];
			_.each(points, function(point,index){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				var sum = 0;
				var contArray = [0,0,0,0,0,0,point.value]
				_.each(pointsInside, function(pointInside) {
					if(parseFloat(weights[pointInside.type]) > 0) {
						contArray[pointInside.type] ++;
						sum ++;
					}
				})

				contArray[contArray.length - 1] = point.value;

				if(sum > 0) {
					if(index/points.length <= 0.7) {
						training_data.push(contArray);
					}
					else {
						test_data.push(contArray);
					}
				}
			});

			mapDiscretization(req,res,registros,training_data,test_data,maxArray,points);
			return {
				training_data: training_data,
				test_data: test_data
			}

		});
	}

	function prepareData2(req,res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		var weights = req.body.weights;
		
		Data.find(function(err, registros) {

			var max = 0;

			var training_data =[];
			var test_data = [];
			var maxArray = [0,0,0,0,0,0];
			_.each(points, function(point,index){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				var sum = 0;
				var contArray = [0,0,0,0,0,0,point.value]
				_.each(pointsInside, function(pointInside) {
					if(parseFloat(weights[pointInside.type]) > 0) {
						contArray[pointInside.type] ++;
						sum ++;
					}
				})
				_.each(contArray, function(cont,index){
					if(maxArray[index]<=cont) {
						maxArray[index] = cont;
					}
				})

				contArray[contArray.length - 1] = point.value;

				
				if(sum > 0) {
					if(index/points.length <= 0.7) {
						training_data.push(contArray);
					}
					else {
						test_data.push(contArray);
					}
				}
			});
			training_data = _.map(training_data,function(data) {
				data = _.map(data,function(value,index) {
					if (index != data.length - 1) {
						if (maxArray[index] !== 0) {
							return Math.ceil(value/maxArray[index]*100 * 100)/100;
						}
					}
					return value;
				})
				return data;
			});

			test_data = _.map(test_data,function(data) {
				data = _.map(data,function(value,index) {
					if (index != data.length - 1) {
						if (maxArray[index] !== 0) {
							return Math.ceil(value/maxArray[index]*100 * 100)/100;
						}
					}
					return value;
				})
				return data;
			});

			mapDiscretization(req,res,registros,training_data,test_data,maxArray,points);
			return {
				training_data: training_data,
				test_data: test_data
			}

		});
	}




