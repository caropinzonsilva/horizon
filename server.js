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

	/*var geo = require('geotabuladb');
	geo.setCredentials({
	    type: 'postgis',
		host: 'localhost',
		user: 'geotabula',
		password: 'geotabula',
		database: 'geotabula'
	});
	geo.connectToDb();
	geo.geoQuery({
	    geometry : 'geom',
	    tableName : 'barrios_catastrales_wgs84',
	    properties : 'all'
	}, function(json) {
		var fs = require('fs');
		var stream = fs.createWriteStream("add_regiones_estratos.sh");
			stream.once('open', function(fd) {
				_.each(json.features, function(po,index) {
					var notRandomNumbers = [1, 2, 2, 3, 3, 3, 4, 4, 5, 6];
  					var idx = Math.floor(Math.random() * notRandomNumbers.length);
					var estrato = notRandomNumbers[idx];;
					var y = 'mongo tesisdb --eval \'db.registros.insert({"type":0,"timeB":0,"timeE":0,"value":' + estrato + ',"region":{type: "Polygon",coordinates:[[';
					//console.log(po.geometry.coordinates[0][0]);
					_.each(po.geometry.coordinates[0][0], function(x,index) {
						//console.log(x);
						y = y + '[' + x[1] + ',' + x[0] + ']';
						if (index < po.geometry.coordinates[0][0].length - 1) {
							y = y + ',';
						}
					})
					y = y + ']]}});\'\n';
					stream.write(y);
					
				});
			console.log('end');
			stream.end();
		});
	});*/

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

	/*client.stream('statuses/filter', {'locations':'4.533741,-74.201731,4.760621,-74.007410'}, function(stream) {
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
	});*/


	//JSON support-------------------------------------------------------------------------------------
	// create application/x-www-form-urlencoded parser
	app.use(bodyParser.urlencoded({ extended: true }))
	// create application/json parser
	app.use(bodyParser.json())

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

	app.post('/explore', function(req, res) {
		//algoritmoInicial(req, res);
		//prepareData(req,res);
		console.log("called");
		decisionTreev2(req, res);
		//argoritmoc45(req, res);
		//logisticRegression(req, res);
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

	/*saveCSVData(6,'twitter1.csv');
	saveCSVData(6,'twitter2.csv');
	saveCSVData(6,'twitter3.csv');
	saveCSVData(6,'twitter4.csv');
	saveCSVData(6,'twitter5.csv');
	saveCSVData(6,'twitter6.csv');
	saveCSVData(6,'twitter7.csv');
	saveCSVData(6,'twitter8.csv');
	saveCSVData(6,'twitter9.csv');
	saveCSVData(6,'twitter10.csv');*/

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
		    	/*//if (i < 14070) {
			    	var lat = data[6];
				    var lng = data[7];
				    //var date = moment(data[0]).valueOf();
				    var date = 0;
				    if (data[8] != 0) {
				    	date = moment(data[8]).valueOf()
				    }
				    
				    var value = "N/A";
				    var value = -1;
				    if (lat !== '' && i !== 0) {
			    		writer.write([date,lat,lng,value]);
				    }
				//}*/
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

	/*formatCSV('01');
	formatCSV('02');
	formatCSV('03');
	formatCSV('04');
	formatCSV('05');
	formatCSV('06');
	formatCSV('07');
	formatCSV('08');
	formatCSV('09');
	formatCSV('10');*/
 

	//Web Sockets---------------------------------------------------------------------------------------
	var count = 0;

	io.on('connection', function(socket){
		console.log();
		/*socket.on('data', function(data) {
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
  		});*/
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
			numberSuggestions: numberSuggestions,
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
			sugestionClass: sugestionClass
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

		cityDiscretization(index);
	}

	function cityDiscretization(index) {
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

		petitionsParameters[index].countSearchesArray = 0;
		petitionsParameters[index].countSearchesDB = 0;
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
					petitionsParameters[index].countSearchesDB ++;
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
					if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == 2*max*petitionsParameters[index].otherContextVariables.length) {
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
					petitionsParameters[index].countSearchesDB ++;
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
					if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == 2*max*petitionsParameters[index].otherContextVariables.length) {
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
					//var vector = petitionsParameters[index].vectors[contVectors].vector;
				}
				_.each(petitionsParameters[index].otherContextVariables, function(contextVariable) {
					petitionsParameters[index].countSearchesArray ++;
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
						//console.log(features);
						//vector[contextVariable.name] = points.length;
						if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == 2*max*petitionsParameters[index].otherContextVariables.length) {
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
					//var vector = petitionsParameters[index].vectors[contVectors].vector;
				}
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
							vector.vector[key] ++;
						})
						//console.log(features);
						//vector[contextVariable.name] = points.length;
						if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == 2*max*petitionsParameters[index].otherContextVariables.length) {
							console.log('done');
							analyzeDiscretization(index);
						}
					}
				})
			}
		}

	}

	function analyzeDiscretization(index) {
		process.stdout.write('Analyze Discretization'); 
		petitionsParameters[index].suggestions = [];
		_.each(petitionsParameters[index].vectors, function(vector) {
			process.stdout.write('.'); 
			var sum = 0;
			_.each(petitionsParameters[index].features,function(feature){
				sum += vector.vector[feature];
			});
			if (sum != 0) {
				var classPredicted = petitionsParameters[index].dt.predict(vector.vector);
				//console.log(classPredicted);
				if(classPredicted == petitionsParameters[index].sugestionClass) {
					vector.sum = sum;
					petitionsParameters[index].suggestions.push(vector);
				}
			}
		})
		console.log('done'); 
		orderSuggestions(index);
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
			"suggestions": sugerenciasFinal.slice(0,petitionsParameters[index].numberSuggestions),
			"accuracy": petitionsParameters[index].accuracy,
			"index": index
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
			if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
				console.log('done');
				if(functionType == 1) {
					createTree(index);
				}
				else {
					var classPredicted = petitionsParameters[index].dt.predict(vector);
						
					petitionsParameters[index].res.send(JSON.stringify({
						"status": "ok",
						"classPredicted": classPredicted
					}));
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
			if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
				console.log('done');
				if(functionType == 1) {
					createTree(index);
				}
				else {
					var classPredicted = petitionsParameters[index].dt.predict(vector);
						
					petitionsParameters[index].res.send(JSON.stringify({
						"status": "ok",
						"classPredicted": classPredicted
					}));
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

				
				if(petitionsParameters[index].countSearchesDB == 2*max && petitionsParameters[index].countSearchesArray == max*petitionsParameters[index].otherContextVariables.length) {
					console.log('done');
					if(functionType == 1) {
						createTree(index);
					}
					else {
						var classPredicted = petitionsParameters[index].dt.predict(vector);
						
						petitionsParameters[index].res.send(JSON.stringify({
							"status": "ok",
							"classPredicted": classPredicted
						}));
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
		var numberSuggestions = req.body.numberSuggestions;
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
			//console.log(training_data);
			//console.log(test_data);
			var class_name = "valor";
			var features = ["c0","c1", "c2", "c3", "c4", "c5"];
			var dt = new DecisionTree(training_data, class_name, features);
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

	function argoritmoc45(req, res) {
		if (!req.body) return res.sendStatus(400)
		res.setHeader('Content-Type', 'application/*+json');

		var points = req.body.points;
		var radius = req.body.radius;
		var latLngDist = req.body.radius/100*0.001;
		var weights = req.body.weights;
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
					if(parseFloat(weights[pointInside.type]) > 0) {
						cont[pointInside.type] ++;
					}
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
							if(parseFloat(weights[pointInside.type]) > 0) {
								cont[pointInside.type] ++;
							}
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
			console.log("training_data--------------------------------------");
			console.log(training_data);

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

	function mapDiscretization(req,res,registros,training_data,test_data,maxArray,points) {
		var latLngDist = req.body.radius/100*0.001;
		var bogotaLngDist = -74.007410 - -74.201731,
			bogotaLngI = -74.201731,
			bogotaLngF = -74.007410,
			bogotaLatDist = 4.760621 - 4.533741,
			bogotaLatI = 4.533741,
			bogotaLatF = 4.760621;
		var diffLng = latLngDist*2,
			diffLat = latLngDist*2;
		var weights = req.body.weights;
		var sugerencias = [];
		var numberSuggestions = req.body.numberSuggestions;
		for (var i = bogotaLngI; i < bogotaLngF; i += diffLng) {
			for (var j = bogotaLatI; j < bogotaLatF; j += diffLat) {
				var i2 = i+diffLat;
				var j2 = j+diffLng;
				//Encuentro los puntos del problema en el recuadro
				var existingPointsInside = _.filter(points, function(point) {
					return point.lat >= j && point.lat <= j2 && point.lng >= i && point.lng <= i2;
				});
				//Solo me interesa si no existe ningun punto en el recuadro
				if (existingPointsInside.length == 0) {
				
					var pointsInside = _.filter(registros, function(registro) {
						return registro.lat >= j && registro.lat <= j2 && registro.lng >= i && registro.lng <= i2;
					});

					var cont = [0,0,0,0,0,0]
					_.each(pointsInside, function(pointInside) {
						if(parseFloat(weights[pointInside.type]) > 0) {
							cont[pointInside.type] ++;
						}
					})

					var sumaCont = 0;
					cont = _.map(cont,function(value,index) {
						sumaCont = sumaCont + value;
						if (maxArray[index] !== 0) {
							return Math.ceil(value/maxArray[index]*100 * 100)/100;
						}
						return value;
					})

					if(sumaCont > 0) {
						//console.log(cont,sumaCont);
						//console.log('sumaCont', sumaCont);
						//console.log(cont);
						var sugerencia = kNearestNeighbor(cont,training_data,weights);
						if(sugerencia.class === 'CLASS2') {
							//console.log(sugerencia);
							sugerencia.punto = {
								lat: (j+j2)/2,
								lng: (i+i2)/2
							};
							sugerencia.cont = sumaCont;
							sugerencias.push(sugerencia);
						}
					}
				}
			}
		}

		sugerencias = _.sortBy(sugerencias, function(sugerencia) {
			return sugerencia.distance;
		});
		console.log(sugerencias);
		/*	function(sugerencia) {
			return sugerencia.distance;
		})*/
		sugerencias = _.map(sugerencias, function(sugerencia) {
			return sugerencia.punto;
		})
		//console.log(sugerencias.slice(0,numberSuggestions));
		res.send(JSON.stringify({
			"status": "ok",
			"suggestions": sugerencias.slice(0,numberSuggestions),
			"accuracy": 0.8
		}));
	}

	function kNearestNeighbor(cont,training_data,weights){
		var minDistance =  null;
		var nearest = null;
		_.each(training_data,function(data) {
			var distance = 0;
			_.each(cont,function(value,index){
				//console.log(parseFloat(weights[index]));
				var w = 1;
				if(parseFloat(weights[index] == 0.5)) {
					w = 100;
				}
				distance = distance + Math.pow(value - data[index],2);
			})
			distance = Math.sqrt(distance);
			//Math.sqrt(0.5*Math.pow(data[0] - cont[0],2) + 1*Math.pow(data[1] - cont[1],2) + 0.5*Math.pow(data[2] - cont[2],2 + 0.5*Math.pow(data[3] - cont[3],2));
			if(minDistance ==  null || distance < minDistance) {
				minDistance = distance;
				nearest = data;
			}  
		});
		console.log(cont,nearest[nearest.length - 1]);
		return {
			class: nearest[nearest.length - 1],
			distance: minDistance
		};
	}



