var net = require('net');

var stream = net.createConnection(8124);
stream.addListener("connect", function(){
 console.log('connected');

 stream.write('a');
    //stream.flush();
 stream.write('b');
    //stream.flush();

});

stream.addListener("data", function(data){
 console.log("Message: \n" + data + "\n - end of msg.");
});