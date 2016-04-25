/*//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/tesisdb';

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	}
	else {
	// Get the documents collection
    var collection = db.collection('users');

    //Create some users
    var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    // Insert some users
    collection.insert([user1, user2, user3], function (err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
		}

		//Close connection
		db.close();
	});
	}
});*/

/*var net = require('net');

    net.createServer(onConnection).listen(8124);

    function onConnection(socket) {
    	socket.setNoDelay(true);

     	socket.addListener("connect", function () {
      		console.log('client connected: ' + this.remoteAddress);
     	});

     	socket.addListener("data", function (data) {
      		console.log("message: \n" + data + "\n - end of msg.");
     	});

     	socket.addListener("end", function () {
      		console.log('end of connection');
      		this.end();
     	});
    }

    console.log('Server running at 127.0.0.1:8124');*/

    /*var fluffy = new Kitten({ name: 'fluffy' });

	var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function() {
		  	fluffy.save(function (err, fluffy) {
				if (err) return console.error(err);
				fluffy.speak();
			});

		  	Kitten.find(function (err, kittens) {
				if (err) return console.error(err);
				console.log(kittens);
			})

	});*/
	var app = require('express')();
	var http = require('http').Server(app);
	var io = require('socket.io')(http);
	var express = require('express');
	var MongoClient = require('mongodb').MongoClient;
	var mongoose = require('mongoose');
	var bodyParser = require('body-parser');
	var Twitter = require('twitter');
	var fs = require("fs");
	var csv = require("fast-csv");
	var moment = require('moment');
	var _ = require('lodash');
	var csvWriter = require('csv-write-stream');
	var sentiment = require('sentiment');
	var DecisionTree = require('decision-tree');
	var cluster = require('k-means');
	var C45 = require('c4.5');
	var ml = require('machine_learning');
	var _ = require('lodash');

	// Add headers
	app.use(function (req, res, next) {

	    // Website you wish to allow to connect
	    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

	    // Request methods you wish to allow
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	    // Request headers you wish to allow
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	    // Set to true if you need the website to include cookies in the requests sent
	    // to the API (e.g. in case you use sessions)
	    res.setHeader('Access-Control-Allow-Credentials', true);

	    // Pass to next layer of middleware
	    next();
	});

 
 	//Twitter-----------------------------------------------------------------------------------------
	var client = new Twitter({
	  	consumer_key: 'yTa9x8ePYPwuqzMhtFyjONS78',
		consumer_secret: '33qohwnrUH2ThGXluDlAVTxBXYHe8wtQRYz2lgs2GvXDv0Q1KX',
		access_token_key: '4494339867-jjDmNVKzBZ3mKRJrOhUQ6nTOCrDsnhl0mX3TCi0',
		access_token_secret: '0HefD9zIX5Y3N5wqUwYUM1k2JhrJWMHEvU1VapwZtzWFm'
	});

	/*client.get('geo/search',{'q':'','lat':41.8339042,'long':-88.0123474,'granularity':'city','max_results':1000},function(error, tweets, response){
		if(error) console.log(error);
		//console.log(tweets.result.places);  // The favorites. 
		console.log(response.body);  // Raw response object. 
	});*/

	client.stream('statuses/filter', {'locations':'4.533741,-74.201731,4.760621,-74.007410'}, function(stream) {
		//-87.945056,41.637659,-87.533069,42.017307
		stream.on('data', function(tweet) {
			if (tweet.coordinates) {
				console.log('timestamp: ',tweet.timestamp_ms);
				var time = tweet.timestamp_ms;
				console.log('text: ', tweet.text);
				var value = parseInt(sentiment(tweet.text).score);
				var lat = tweet.coordinates.coordinates[1];
				var lng = tweet.coordinates.coordinates[0];
				var type = 3;
				if (lng >= -74.201731 && lng <= -74.007410 && lat >= 4.533741 && lat <= 4.760621) {
					console.log('sentiment:',value);
					console.log('coordinates: ', tweet.coordinates);
					console.log('-------------------');

					MongoClient.connect(url, function(err, db) {
						if (err) {
			 		 		console.log('Error connecting client');
			 		 	}

			 		 	db.collection('registros').insertOne({
							"timeB": parseInt(time),
							"timeE": parseInt(time),
							"lat": parseFloat(lat),
							"lng": parseFloat(lng),
							"value": parseInt(value),
							"type": parseInt(type)
					    }, function(e,r) {
					    	if (e) {
					    		if (prev !== 'error') {
					    			console.log('error: ', i);
					    			prev = 'error';
					    		}
					    		db.close();
					    	}
					    });
					});
				}

			}
		});
	 
		stream.on('error', function(error) {
			console.log(error);
		});
	});


	//JSON support-------------------------------------------------------------------------------------
	// create application/x-www-form-urlencoded parser
	app.use(bodyParser.urlencoded({ extended: true }))
	// create application/json parser
	app.use(bodyParser.json())

	var dataTypes = ['Crimes', 'Police_Stations'];

	//Mongodb settup-----------------------------------------------------------------------------------
	//Mongodb Schema Definitions
	var dataSchema = mongoose.Schema({
	    lat: Number,
	    lng: Number,
	    timeB: Number,
	    timeE: Number,
	    value: Number, 
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
	    password: String
	});

	userSchema.methods.isUser = function (email, password, token) {
		return (email === this.email) && (password === this.password) && (token === this.ObjectID);
	}

	var User = mongoose.model('User', userSchema);

	var projectSchema = mongoose.Schema({
	    name: String,
	    description: String,
	    graphs: [String],
	    user_id: mongoose.Schema.Types.ObjectId
	});

	var Project = mongoose.model('Project', projectSchema);

	//Mongodb connection
	var url = 'mongodb://localhost:27017/tesisdb';
	mongoose.connect(url);

	//URL definitions----------------------------------------------------------------------------------
	app.use(express.static('public'));

	app.get('/', function(req, res){
	  	res.send(':D');
	});

	app.get('/map/:type', function(req, res){
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

	app.post('/explore', function(req, res) {
		//algoritmoInicial(req, res);
		decisionTree(req, res);
		//argoritmoc45(req, res);
		//logisticRegression(req, res);
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
						"token": user._id
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
					"token": user._id
				}));
			}
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

	var saveCSVData = function(type) {
		var valueArray = [];

		//Connect to database
		MongoClient.connect(url, function(err, db) {
			if (err) {
 		 		console.log('Error connecting client');
 		 	}

		  	//Read CSV
			var stream = fs.createReadStream("bomberos.csv");
			var i = 0;
			var prev = 0;

			var csvStream = csv()
		    .on("data", function(data){
		    	console.log(i);
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
						"timeE": parseInt(0),
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
		        console.log("done");
		    });
		 
			stream.pipe(csvStream);
		});
	}

	//saveCSVData(5);

	function formatCSV() {
		var stream = fs.createReadStream("cines_sin_date.csv");
		var i = 0;
		var prev = 0;


		var writer = csvWriter({ headers: ["time", "lat", "lng", "value"]});
		writer.pipe(fs.createWriteStream('cines.csv'));

		var csvStream = csv()
	    .on("data", function(data){
	    	if (parseInt(i/100000) !== prev) {
	    		console.log(i);
	    		prev = parseInt(i/100000);
	    	}
	    	//if (i < 14070) {
		    	var lat = data[1];
			    var lng = data[2];
			    //var date = moment(data[0]).valueOf();
			    var date = 0;
			    if (data[0] != 0) {
			    	date = moment(data[0]).valueOf();
			    }
			    
			    //var value = data[3];
			    var value = -1;
			    if (lat !== '' && i !== 0) {
		    		writer.write([date,lat,lng,value]);
			    }
			//}
			i ++;
	    })
	    .on("end", function(){
	        console.log("done");
			writer.end();
	    });
	 
		stream.pipe(csvStream);
	}

	//formatCSV();
 

	//Web Sockets---------------------------------------------------------------------------------------
	var count = 0;

	io.on('connection', function(socket){
		socket.on('data', function(data) {
  			console.log(data);
  			socket.to('browsers').emit('data_received', { lat: data.lat,
				lng: data.lng,
				time: data.time,
				info: data.info,
				value: data.value,
				project_id: '56e01bd685774c7a7603ccbe'
			});
  		});

  		socket.on('im_browser', function(data) {
  			socket.join('browsers');
  		});
	});

	//Decision Tree------------------------------------------------------------------------------------
	/*var training_data = [
		{"color":0, "shape":0, "liked":0},
		{"color":1, "shape":0, "liked":0},
		{"color":0, "shape":1, "liked":1},
		{"color":1, "shape":1, "liked":1},
		{"color":0, "shape":3, "liked":2},
		{"color":1, "shape":3, "liked":1},
		{"color":2, "shape":3, "liked":0},
		{"color":2, "shape":1, "liked":0}
	];
	var test_data = [
		{"color":1, "shape":3, "liked":0},
		{"color":0, "shape":3, "liked":1},
		{"color":2, "shape":3, "liked":2},
		{"color":3, "shape":1, "liked":1}
	];
	var class_name = "liked";
	var features = ["color", "shape"];
	var dt = new DecisionTree(training_data, class_name, features);
	var predicted_class = dt.predict({
		color: 0,
		like: 1
	});
	var accuracy = dt.evaluate(test_data);
	console.log(predicted_class,accuracy);
	var treeModel = dt.toJSON();*/

	/*var matrixa = [[1, 1, 3], [4, 5, 1], [6, 5, 2]];
	var optionsa = {
		clusters:2, // number of clusters we want to cluster our data into. The default is 2. Sometimes, it is natural for one or more clusters to end up being excluded if they would not contain any data points.
		iterations: 10 // number of iterations we want our k-means to run. The higher the number, the potentially more accurate, but it might take longer. The algorithm will cut off early if clusters stay perfectly consistent between iterations.
	}
	var callbacka = function (results){
		console.log(results)
	}
	cluster(matrixa,optionsa,callbacka);*/
  

	//Open port----------------------------------------------------------------------------------------
	http.listen(80, function(){
	  	console.log('listening on *:80');
	});

	function algoritmoInicial(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		//lng 100m = 0.001
		//lat 100m = 0.001
		Data.find(function(err, registros) {
			if (err) return console.error(err);
			var pointsCluster = [];
			var max = 0;
			_.each(points, function(point){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				//console.log(pointsInside.length);
				var cont = [0,0,0,0,0,0,point.value]
				/*if (parseInt(point.value)>= max) {
					max = parseInt(point.value);
				}*/
				_.each(pointsInside, function(pointInside) {
					cont[pointInside.type] ++;
				})

				pointsCluster.push(cont);

			});

			var maxPoints = _.filter(pointsCluster, function(point) {
				return point[6] == 'CLASS2'
			});
			//console.log('maxPoints',maxPoints);

			var avgMax = [0,0,0,0,0,0];
			_.each(maxPoints,function(maxPoint) {
				avgMax[0] += maxPoint[0];
				avgMax[1] += maxPoint[1];
				avgMax[2] += maxPoint[2];
				avgMax[3] += maxPoint[3];
				avgMax[4] += maxPoint[4];
				avgMax[5] += maxPoint[5];
			})
			//console.log('avgMax',avgMax);

			var finalAverage = [0,0,0,0,0,0]
			_.each(avgMax, function(avg,index){
				finalAverage[index] = Math.round(avg/avgMax.length);
			})

			//console.log('finalAverage',finalAverage);

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
			for (var i = bogotaLngI; i < bogotaLngF; i += diffLng) {
				for (var j = bogotaLatI; j < bogotaLatF; j += diffLat) {
					var i2 = i+diffLat;
					var j2 = j+diffLng;
					var pointsInside = _.filter(registros, function(registro) {
						return registro.lat >= j && registro.lat <= j2 && registro.lng >= i && registro.lng <= i2;
					});
					//console.log(pointsInside);
					var cont = [0,0,0,0,0,0]
					_.each(pointsInside, function(pointInside) {
						cont[pointInside.type] ++;
					})
					var distancia = 0;
					_.each(cont,function(c,index) {
						distancia += Math.pow(Math.abs(c - finalAverage[index]),2);
					});
					distancia = Math.sqrt(distancia);
					if (min == -1) {
						min = distancia;
						coordinates = [j,j2,i,i2];
					}
					else if (min >= distancia) {
						min = distancia;
						coordinates = [j,j2,i,i2];
					}
					//console.log(distancia,min);
				}
			}
			//console.log(coordinates);
			var lat  = (coordinates[0] + coordinates[1])/2;
			var lng = (coordinates[2] + coordinates[3])/2;
			//console.log(lat,lng);
			res.send(JSON.stringify({
				"status": "ok",
				"lat":lat,
				"lng":lng
			}));
		});
	}

	function decisionTree(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var numberSuggestions = req.body.numberSuggestions;
		var latLngDist = req.body.radius/100*0.001;
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
					cont[pointInside.type] ++;
				})
				//pointsCluster.push(cont);
				//console.log(cont);
				var objectCont = {
					"calidadAire": cont[0],
					"estacionesPolicia": cont[1],
					"estacionesTrasnmilenio": cont[2],
					"cines": cont[3],
					"universidades": cont[4],
					"estacionesBomberos": cont[5],
					"valor": point.value
				}
				if(index/points.length <= 0.7) {
					training_data.push(objectCont);
				}
				else {
					test_data.push(objectCont);
				}

			});
			console.log(training_data);
			console.log(test_data);
			var class_name = "valor";
			var features = ["calidadAire","estacionesPolicia", "estacionesTrasnmilenio", "cines", "universidades", "estacionesBomberos"];
			var dt = new DecisionTree(training_data, class_name, features);
			accuracy = dt.evaluate(test_data);
			console.log('accuracy',accuracy);

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
					var i2 = i+diffLat;
					var j2 = j+diffLng;
					var pointsInside = _.filter(registros, function(registro) {
						return registro.lat >= j && registro.lat <= j2 && registro.lng >= i && registro.lng <= i2;
					});
					//console.log(pointsInside);
					var cont = [0,0,0,0,0,0]
					_.each(pointsInside, function(pointInside) {
						cont[pointInside.type] ++;
					})
					var sumaCont = cont[0] + cont[1] + cont[2] + cont[3] + cont[4] + cont[5];
					var objectCont = {
						"calidadAire": cont[0],
						"estacionesPolicia": cont[1],
						"estacionesTrasnmilenio": cont[2],
						"cines": cont[3],
						"universidades": cont[4],
						"estacionesBomberos": cont[5]
					}
					var prediction = dt.predict(objectCont)
					if (prediction == 'CLASS2' && sumaCont > 0) {
						var existingPoints = _.filter(points, function(point) {
							return point.lat >= j && point.lat <= j2 && point.lng >= i && point.lng <= i2;
						});
						if(existingPoints.length == 0) {
							var sugerencia = {
								lat: (j+j2)/2,
								lng: (i+i2)/2
							};
							console.log(existingPoints,objectCont,dt.predict(objectCont));
							sugerencias.push(sugerencia);
						}
					}
					//console.log(distancia,min);
				}
			}
			res.send(JSON.stringify({
				"status": "ok",
				"suggestions": sugerencias.slice(0,numberSuggestions),
				"accuracy": accuracy
			}));

		});
	}

	function argoritmoc45(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		//lng 100m = 0.001
		//lat 100m = 0.001
		Data.find(function(err, registros) {

			var max = 0;

			var training_data =[];
			var test_data = []
			_.each(points, function(point){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				//console.log(pointsInside.length);
				var cont = [0,0,0,0,0,0,point.value]
				/*if (parseInt(point.value)>= max) {
					max = parseInt(point.value);
				}*/
				_.each(pointsInside, function(pointInside) {
					cont[pointInside.type] ++;
				})
				var cont1 = [cont[1],cont[6]]
				//pointsCluster.push(cont);
				//console.log(cont);
				if(Math.random() <= 0.7) {
					training_data.push(cont1);
				}
				else {
					test_data.push(cont1);
				}

			});
			var target  = "valor";
			var features = ["estacionesPolicia"];
			var featureTypes = ['category'];
			console.log(features);
			console.log(featureTypes);
			console.log(training_data);
			var c45 = C45();

			c45.train({
		        data: training_data,
		        target: target,
		        features: features,
		        featureTypes: featureTypes
		    }, function(error, model) {
				if (error) {
					console.error(error);
					return false;
				}

				console.log('test------------',model.classify([1]));

				var contTrue = 0;
				_.each(test_data, function(test) {
					if(model.classify(test) === test[6]) {
						contTrue ++;
					}
					console.log(model.classify(test),model.classify(test) === test[6]);
				});

				console.log('accuracy',contTrue/test_data.length);
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
				for (var i = bogotaLngI; i < bogotaLngF; i += diffLng) {
					for (var j = bogotaLatI; j < bogotaLatF; j += diffLat) {
						var i2 = i+diffLat;
						var j2 = j+diffLng;
						var pointsInside = _.filter(registros, function(registro) {
							return registro.lat >= j && registro.lat <= j2 && registro.lng >= i && registro.lng <= i2;
						});
						//console.log(pointsInside);
						var cont = [0,0,0,0,0,0]
						_.each(pointsInside, function(pointInside) {
							cont[pointInside.type] ++;
						})
						console.log(cont[1],model.classify(cont[1]));
						
						//console.log(distancia,min);
					}
				}
		    });
		});
	}

	function logisticRegression(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		//lng 100m = 0.001
		//lat 100m = 0.001
		Data.find(function(err, registros) {

			var max = 0;

			var training_data =[];
			var test_data = []
			_.each(points, function(point){
				var pointsInside = _.filter(registros, function(registro) {
					return registro.lat >= point.lat - latLngDist && registro.lat <= point.lat + latLngDist && registro.lng >= point.lng - latLngDist && registro.lng <= point.lng + latLngDist
				})
				//console.log(pointsInside.length);
				var cont = [0,0,0,0,0,0,point.value]
				/*if (parseInt(point.value)>= max) {
					max = parseInt(point.value);
				}*/
				_.each(pointsInside, function(pointInside) {
					cont[pointInside.type] ++;
				})
				var cont1 = [cont[1],cont[6]]
				//pointsCluster.push(cont);
				//console.log(cont);
				if(Math.random() <= 0.7) {
					training_data.push(cont1);
				}
				else {
					test_data.push(cont1);
				}

			});
			var x = [[1,1,1,0,0,0],
			         [1,0,1,0,0,0],
			         [1,1,1,0,0,0],
			         [0,0,1,1,1,0],
			         [0,0,1,1,0,0],
			         [0,0,1,1,1,0],
			         [0,0,1,1,1,0]];
			var y = [[1, 0],
			         [2, 0],
			         [1, 0],
			         [0, 1],
			         [0, 1],
			         [0, 1],
			         [0, 1]];
			var classifier = new ml.LogisticRegression({
			    'input' : x,
			    'label' : y,
			    'n_in' : 6,
			    'n_out' : 2
			});
			 
			classifier.set('log level',1);
			 
			var training_epochs = 800, lr = 0.01;
			 
			classifier.train({
			    'lr' : lr,
			    'epochs' : training_epochs
			});
			 
			x = [[1, 1, 0, 0, 0, 0],
			     [0, 0, 0, 1, 1, 0],
			     [0, 0, 1, 1, 1, 0]];
			 
			console.log("Result : ",classifier.predict(x));
		});
	}



