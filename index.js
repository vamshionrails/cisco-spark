/*
Main index file
*/

var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
const config = require("./config.json");

// init flint
var flint = new Flint(config);
flint.start();
console.log("Starting flint, please wait...");

flint.on("initialized", function() {
  console.log("Flint initialized successfully! [Press CTRL-C to quit]");
});

/****
## Process incoming messages
****/


/* On mention with command
ex User enters @botname /hello, the bot will write back
*/
flint.hears('/hello', function(bot, trigger) {
  console.log("/hello fired");
  /*bot.say('%s, you said hello to me ! ', trigger.personDisplayName);*/
  bot.say({markdown: '*Hello <@personEmail:' + trigger.personEmail + '|' + trigger.personDisplayName + '>*'});
});


/* On mention with command, using other trigger data, can use lite markdown formatting
ex "@botname /whoami"
*/
flint.hears('/whoami', function(bot, trigger) {
  console.log("/whoami fired");
  //the "trigger" parameter gives you access to data about the user who entered the command
  let roomId = "*" + trigger.roomId + "*";
  let roomTitle = "**" + trigger.roomTitle + "**";
  let personEmail = trigger.personEmail;
  let personDisplayName = trigger.personDisplayName;
  let outputString = `${personDisplayName} here is some of your information: \n\n\n **Room:** you are in "${roomTitle}" \n\n\n **Room id:** ${roomId} \n\n\n **Email:** your email on file is *${personEmail}*`;
  bot.say("markdown", outputString);
});

/* On mention with command arguments
ex User enters @botname /echo phrase, the bot will take the arguments and echo them back
*/
flint.hears('/echo', function(bot, trigger) {
  console.log("/echo fired");
  let phrase = trigger.args.slice(1).join(" ");
  let outputString = `Ok, I'll say it: "${phrase}"`;
  bot.say(outputString);
});
/*
 roomid
*/
flint.hears('/roomid', function(bot, trigger) {
  console.log("/roomid fired");
  /*bot.say('This is your room ID', trigger.roomId);*/

  bot.say({markdown:'**Here are the current room settings: \n **'+ trigger.roomId,file:'https://www.sabre.com/wp/wp-content/themes/sabre-edl/images/sabre-logo-slab.png'});
});

/*
roomTitle
*/

flint.hears('/roomtitle', function(bot, trigger) {
  console.log("/roomTitle fired");
  /*bot.say('This is your room ID', trigger.roomId);*/

  bot.say({markdown:'**Here are the current room settings: \n **'+ trigger.roomTitle,file:'https://www.sabre.com/wp/wp-content/themes/sabre-edl/images/sabre-logo-slab.png'});
});

/*Help*/
flint.hears('/help', function(bot, trigger, id) {
  bot.say(flint.showHelp(['Help coming soon'],['sabre.com']));
});

/*markdown*/
flint.hears('/hm', function(bot, trigger) {
  console.log("/hm fired");
  /*bot.say('markdown', '**hello**, ```How are you today?```');*/
  bot.say('markdown', 'Hi <@personEmail:vamshidhar.kuchikulla@sabre.com|Vamshi>, your order has been processed.');
});

/* */

 flint.hears(/\/broadcast( |.|$)/i, function(bot, trigger){
  var request = trigger.text.replace("/broadcast ",'');
  if(trigger.personEmail.match(/vamshidhar.kuchikulla@sabre\.com|vamshionrails@gmail\.com/i)){
    _.forEach(flint.bots, function(bot) { bot.say(request); });
  }else{
    bot.say("Sorry but your are not authorised for this command. The authoritities have been notified.");
    bot.dm('vamshionrails@gmail.com','Unauthorised attempt by this person: '+trigger.personEmail);
  }
});

/*
Get Messages
*/
flint.hears('/gm', function(bot, trigger) {
  console.log("/gm fired");
  bot.getMessages(5).then(function(messages) {
  messages.forEach(function(message) {
    // display message text
    if(message.text) {
      console.log(message.text);
    }
  });
});
 });


/*
NLP
*/
flint.hears(/\/broadcast( |.|$)/i, function(bot, trigger){
  var request = trigger.text.replace("/broadcast ",'');
  if(trigger.personEmail.match(/vamshidhar.kuchikulla@sabre\.com|yourotheremail@example\.com/i)){
    _.forEach(flint.bots, function(bot) { bot.say(request); });
  }else{
    bot.say("Sorry but your are not authorised for this command. The authoritities have been notified.");
    bot.dm('youremail@example.com','Unauthorised attempt by this person: '+trigger.personEmail);
  }
});



/****
## Server config & housekeeping
****/

app.post('/', webhook(flint));

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
