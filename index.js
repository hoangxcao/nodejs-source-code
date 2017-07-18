var http = require('http');
var fs = require('fs');
var easypost = require('easypost');
var qs = require('querystring');
var port = 3000;
var ip = '0.0.0.0';

// Retrieve
var MongoClient = require('mongodb').MongoClient;
// This is the remote url to connect to MongoDB
var remoteurl = "mongodb://hoangxcao:Mizuno5695@cluster0-shard-00-00-etqzm.mongodb.net:27017,cluster0-shard-00-01-etqzm.mongodb.net:27017,cluster0-shard-00-02-etqzm.mongodb.net:27017/testdb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";

// Function to insert document to MongoDB
var insertDocument = function(db, JSONData, callback) {
  db.collection('testing').insert(JSONData);
};

// Function to create a new collection holding the game indices
// function getNextSequence(db, name, callback) {
//   db.collection("gamenumcounter").findAndModify( { _id: name }, null, { $inc: { seq: 1 } }, function(err, result){
//     if(err) callback(err, result);
//     callback(err, result.value.seq);
//   } );}

// Start the server
http.createServer(function (request, response) {
  // Handle POST request
  if (request.method == 'POST') {
    // Get the POST request
    easypost.get(request, response, function (data) {
      console.log("Node server heard you!");
      // Parse url content
      data = qs.parse(data);
      var JSONData = JSON.parse(data.JSONData);
      console.log("Received Data!");
      // Connect to the database
      MongoClient.connect(remoteurl, function(err, db) {
        if(!err) {
          // getNextSequence(db, "gameid", function(err, result) {
          //   if(!err) {
          //     for(i=0;i<JSONData.length;i++) {
          //       JSONData[i].gameNum = result;
          //     }
          //     db.collection('testing').distinct('gameNum',(function(err,docs) {
          //       console.log(docs.length);
          //     }));
          var player = JSONData[0].playerId;
          var group = JSONData[0].groupId;
          console.log("Data submitted by:")
          console.log(player);
          console.log(group);
          console.log();

          // When the database has no document, both game numbers will be 1
          db.collection('testing').count( {}, function(err,all) {
            if (all === 0) {
              for(i=0;i<JSONData.length;i++) {
                JSONData[i].overallGameNum = 1;
                JSONData[i].playerGameNum = 1;
              }

              // Insert data to the database
              insertDocument(db, JSONData, function() {
                db.close();
              });

            } else {
              // When the database is not empty, check for overall game number
              db.collection('testing').distinct('overallGameNum',(function(err,ovrl) {
                // Query all data of the player submitting by using player ID and group ID
                // If the player does not have any existing data in the database, overall game number will be incremented by 1, and player game number will be 1
                db.collection('testing').count( { playerId: player, groupId: group }, function(err,qr) {
                  if (qr === 0) {
                    for(i=0;i<JSONData.length;i++) {
                      JSONData[i].overallGameNum = ovrl.length + 1;
                      JSONData[i].playerGameNum = 1;
                    }

                    // Insert data to the database
                    insertDocument(db, JSONData, function() {
                      db.close();
                    });

                  } else {
                    // When the database contains data of the player submitting, check for player game number
                    db.collection('testing').find( { playerId: player, groupId: group } ).toArray(function(err,list) {
                      var distinctPlayerGame = [];

                      for(i=0;i<list.length;i++) {
                        var val = list[i].playerGameNum;

                        if (!(distinctPlayerGame.includes(val))) {
                          distinctPlayerGame.push(val);
                        }
                      }

                      // Overall game number and player game number will both be incremented by 1
                      for(i=0;i<JSONData.length;i++) {
                        JSONData[i].overallGameNum = ovrl.length + 1;
                        JSONData[i].playerGameNum = distinctPlayerGame.length + 1;
                      }

                      // Insert data to the database
                      insertDocument(db, JSONData, function() {
                        db.close();
                      });
                    });
                  }
                });
              }));
            }
          });
        } else {
          throw err;
        }
      });
      console.log("We are connected.\n");
    });
  } 
}).listen(port, ip);
