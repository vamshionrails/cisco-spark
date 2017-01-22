var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var RedisStore = require('node-flint/storage/redis'); // load driver
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');

//import files 
var halo = require("./halo.js");

var app = express();
app.use(bodyParser.json());

// flint options
 
var config = {
  webhookUrl: 'http://88f6150e.ngrok.io/flint',
  token: 'OGRjYjkzOTAtMWVkZS00NjkyLWEyNGItMjk2NTE4N2RlYzY0NWFlYWUyYzgtYzlk',
  port: 8080
};
 
 

// init flint
var flint = new Flint(config);

// use redis storage
flint.storageDriver(new RedisStore('redis://127.0.0.1')); // select driver

//start flint
flint.start();

// The Flint event is expecting a function that has a bot, person, and id parameter.
function checkin(eventBot, person, id) {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = eventBot.recall('htc');

  // if room bot has htc.enabled...
  if(eventBot && eventBot.active && htc.enabled) {
    // wait 5 seconds, add person back, and let them know they can never leave!
    setTimeout(() => {
      var email = person.emails[0];
      var name = person.displayName.split(' ')[0]; // reference first name

      // add person back to room...
      eventBot.add(email);

      // let person know  where they ended up...
      eventBot.say('<@personEmail:%s|%s>, you can **check out any time you like**, but you can **never** leave!', email, name);
    }, 5000); // 5000 ms = 5 seconds
  }
}

// set default messages to use markdown globally for this flint instance...
flint.messageFormat = 'markdown';

// check if htc is already active in room...
flint.on('spawn', bot => {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = bot.recall('htc');

  // if enabled...
  if(htc && htc.enabled) {
    // resume event
    bot.on('personExits', checkin);
  }
});

// open the hotel
flint.hears('open', function(bot, trigger) {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = bot.recall('htc');

  // if htc has not been initialized to bot memory...
  if(!htc) {
    // init key
    htc = bot.store('htc', {});

    // store default value
    htc.enabled = false;
  }

  // if not enabled...
  if(!htc.enabled) {
    htc.enabled = true;

    // create event
    bot.on('personExits', checkin);

    // announce Hotel California is open
    bot.say('**Hotel California** mode activated!');
  } else {
    // announce Hotel California is already open
    bot.say('**Hotel California** mode is already activated!');
  }
});

// close the hotel
flint.hears('close', function(bot, trigger) {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = bot.recall('htc');

  if(htc && htc.enabled) {
    htc.enabled = false;

    // remove event (removeListener is an inherited function from EventEmitter)
    bot.removeListener('personExits', checkin);

    // announce Hotel California is closed
    bot.say('**Hotel California** mode deactivated!');
  } else {
    // announce Hotel California is already closed
    bot.say('**Hotel California** mode is already deactivated!');
  }

});
//greeting
flint.hears('greeting', function(bot, trigger) {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = bot.recall('htc');

  if(htc && htc.enabled) {
    htc.enabled = false;

    // remove event (removeListener is an inherited function from EventEmitter)
    bot.removeListener('personExits', checkin);

    // announce Hotel California is closed  
    bot.say('**Hotel California** Welcome to hotel california!');
  } else {
    // announce Hotel California is already closed
    bot.say('**Hotel California** We already greeted you!');
  }

});

//status
flint.hears('status', function(bot, trigger) {
  // retrieve value of key 'htc'. When this is ran initially, this will return 'undefined'.
  var htc = bot.recall('htc');

  if(htc && htc.enabled) {
    htc.enabled = true;

    // remove event (removeListener is an inherited function from EventEmitter)
    bot.removeListener('personExits', checkin);

    // announce Hotel California is closed  
    bot.say('**Hotel California** Checking Status..!');
  } else {
    // announce Hotel California is already closed
    bot.say('**Hotel California** We already greeted you!');
  }

});

// default message for unrecognized commands
flint.hears(/.*/, function(bot, trigger) {
  bot.say('You see a shimmering light, but it is growing dim...');
}, 20);

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

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