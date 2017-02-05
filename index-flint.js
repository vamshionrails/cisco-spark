/*
CISCO-SPARK bots
https://npm.taobao.org/package/flint-bot
*/
var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

var sqlite3     = require('sqlite3').verbose();
var fs          = require('fs');
var dbFile = './spark-database.db';
var dbExists = fs.existsSync(dbFile);

if(!dbExists) {
    fs.openSync(dbFile, 'w');
}
var db = new sqlite3.Database(dbFile);

if(!dbExists)
{
    db.run('CREATE TABLE `my_table` (' +
    '`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,' +
    '`name` TEXT UNIQUE ON CONFLICT REPLACE,' +
    '`pname` TEXT,' +
    '`email` TEXT,' +
    '`number` INTEGER,' +
    '`extra` TEXT)');
} 

// flint options 
var config = {
  webhookUrl: 'http://4d5f3edc.ngrok.io',
  token: 'YmM3ZDJhNDAtZTVlMC00ZDUxLWExZDQtZmFiNWE5NDRhYTJiMGIwNTUzZjctMDMx',
  port: 10010
};
 
// init flint 
var flint = new Flint(config);
flint.start();
console.log("Starting spark server, please wait...");

flint.on("initialized", function() {
  console.log("Spare Server initialized successfully! [Press CTRL-C to quit]");
});

//Authorization
function myAuthorizer(bot, trigger, id) {
  if(trigger.personEmail === 'vamshidhar.kuchikulla@sabre.com') {
    return true;
  }
  else if(trigger.personDomain === 'test.com') {
    return true;
  }
  else {
    return false;
  }
}

//create bot @bot /create <name> 
flint.hears('/create', function(bot, trigger) {
console.log('add triggered');

let name = trigger.args.slice(1).join(" ");
db.run("INSERT OR REPLACE INTO my_table (name, pname,email, number, extra) VALUES ($name,$pname, $email,$number,$extra)", {
        $name: name,
        $pname: trigger.personDisplayName,
        $email: trigger.personEmail,
        $number: 10,
        $extra: 'extra'
}); 
db.each("SELECT id, name, email FROM my_table", function(err, row) {
      console.log("User name : "+row.id, row.name, row.email);
      //bot.say({markdown: row.name + row.email});
 }); 
});


// add bot @bot /add <name> <description>
flint.hears('/add', function(bot, trigger) {
console.log('add triggered');
let name = trigger.args.slice(1).join(" ");
db.run("INSERT OR REPLACE INTO my_table (name, pname,email, number, extra) VALUES ($name,$pname, $email,$number,$extra)", {
        $name: name,
        $pname: trigger.personDisplayName,
        $email: trigger.personEmail,
        $number: 10,
        $extra: 'extra'
}); 
db.each("SELECT id, name, email FROM my_table", function(err, row) {
      console.log("User name : "+row.id, row.name, row.email);
      //bot.say({markdown: row.name + row.email});
 }); 
});

//status bot @bot /status 
flint.hears('/status', function(bot, trigger) {
  console.log('status triggered')
  db.each("SELECT id, name, email FROM my_table", function(err, row) {
      console.log("User name : "+row.id, row.name, row.email);
      bot.say({markdown: row.name + row.email});
 }); 
});

//update bot @bot /update <pname> <pemail>
flint.hears('/update', function(bot, trigger) {
  console.log('update');
  //db.run("UPDATE my_table SET name = ? WHERE id = ?", "bar", 2);
  //db.run("UPDATE tbl SET name = ? WHERE id = ?", [ "bar", 2 ]);
  db.run("UPDATE my_table SET name = $name WHERE id = $id", {
          $id: 2,
          $name: "vamshidhar"
  });
});

//delete bot @bot /delete <pname> <pemail>
flint.hears('/delete', function(bot,trigger){
  console.log('delete');
  let pname = trigger.args.slice(1).join(" ");
  db.run("DELETE FROM my_table WHERE name= $pname",{
    $pname: pname
 });
});

//help bot @help /help
flint.hears('/help', function(bot,trigger) {
  console.log('triggered help'); 
  bot.say({markdown: '*Halo Import:' + halo.sayHelloInEnglish()});

}); 

// define express path for incoming webhooks 
app.post('/', webhook(flint));
 
// start express server 
var server = app.listen(config.port, function () {
  flint.debug('Flint listening on port %s', config.port);
});
 
// gracefully shutdown (ctrl-c) 
process.on('SIGINT', function() {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});
