var settings = require('./settings');

var redis = require('redis');
client = redis.createClient();

var mongoose = require('mongoose');
mongoose.connect('localhost', 'chat');
var schema = mongoose.Schema({ _id:'number', token: 'string', tokenSecret: 'string', username:'string'}, {strict:false});
var Users = mongoose.model('Users', schema);

var twitter = require('ntwitter');

var buffer = {};

client.subscribe('test');
client.on("message", function(channel, message){
	var msg = JSON.parse(message);
	msg.date = new Date();
	var buf_key = msg.from + ":" + msg.to;
	if(typeof buffer[buf_key] == 'undefined'){
		buffer[buf_key] = [];
	}
	buffer[buf_key].push(msg);
	//offlinemsgs:of:7503500 
});

setInterval(function(){

	var now = new Date();
	for(var i in buffer){
		var last = buffer[i][buffer[i].length-1];
		var then = last.date;
		var msg = buffer[i];
		var to = parseInt(last.to);
		var from = parseInt(last.from);
		console.log(last);
		var msg_length = buffer[i].length;
		//if(now-then > 1000 * 60 * 1){
		if(now-then > 1000){
			//get tokens
			Users.find({_id:{$in:[to,from]}},{token:1, tokenSecret:1, username:1}, function(err, docs){
				if(err) throw err;
				if(docs.length != 2){
					return;
				}
				//find to
				var from;
				var to;
				if(docs[0]._id == from){
					from = docs[1];
					to = docs[0];
				}else{
					from = docs[0];
					to = docs[1];
				}
				
				var twit = new twitter({
					consumer_key: settings.consumerKey,
					consumer_secret: settings.consumerSecret,
					access_token_key: from.token,
					access_token_secret: from.tokenSecret
				});
				var m = "@" + to.username + " I have new messages for you on chat..";
				console.log(m);
				twit.updateStatus(m, function(err, data){
					console.log(arguments);
				});
			});
			
			//get 
			delete buffer[i];
		}
	}
}, 1000);
