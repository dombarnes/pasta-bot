if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const tmi = require('tmi.js')
const fs = require('fs')
const readline = require('readline')

// Define TMI configuration options
const tmiOpts = {
  connection: { reconnect: true },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ],
  options: { debug: true }
};

// Create a TMI client with our options
const client = new tmi.client(tmiOpts);
client.connect();

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

var pasta = []
function loadPasta() { 
  const readInterface = readline.createInterface({
    input: fs.createReadStream('./pasta.txt'),
    output: process.stdout,
    console: false
  });

  count = 0
  readInterface.on('line', function(line) {
    console.log(`Loading ${line}`)
    pasta.push(line)
    count ++
  });
  console.log(`Loaded ${count} pastas`)
}

function saveExternalPasta(message){

}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();
  // if (!commandName.toLowerCase().startsWith('!')) { return; }

  // If the command is known, let's execute it
  if (commandName === '!dice') {
    rollDice(target)
  } else if (commandName.startsWith('!addpasta')) {
    console.log('adding pasta')
    addPasta(target, context, msg)
  } else if (commandName === "!pasta") {
    countPasta(target)
  } else if (commandName.length > 20) {
    if (isPasta(msg)) {
      console.debug(`Deleting pasta ${msg}`)
      deletePasta(target, context, msg)
    }
  } else {
    console.log(`* Unknown command ${commandName}`)
    console.log(`* context: ${JSON.stringify(context)}`)
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`)
  loadPasta()
}

function addPasta(target, context, message) {
  var pastaMsg = message.replace('!addpasta','').trim()
  console.log(`Checking ${pastaMsg}`)
  if (isPasta(pastaMsg)){ 
    console.log(context)
    client.say(target, `/me We've already got that one thanks ${context.username}`)
    return
  }
  pasta.push(pastaMsg)
  client.say(target, `/me Pasta Saved ${message}`)
  fs.appendFile('pasta.txt', pastaMsg + '\n', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

function isPasta(message) {
  console.log(`Checking pasta for ${message}`)
  if (pasta.includes(message)) {
    return true
  } else {
    return false
  }
}

function deletePasta(target, context, message) {
  console.log(`Checking pasta for ${message}`)
  if (pasta.includes(message)) {
    console.log('Pasta found!')
    client.deletemessage(process.env.CHANNEL_NAME, context.id)
    .then((data) => {
      // data returns [channel]
      client.say(target, 'No CopyPasta for you!')
    }).catch((err) => {
      //
      console.log(`Error deletemessage ${err}`)
      console.log(pasta)
    })
    client.say(target, 'No CopyPasta for you!')
  } else {
    console.log('Pasta not found')
    console.log(pasta)
  }
  return;
}

function countPasta(target) {
  client.say(target, `Pasta\'s saved: ${pasta.length}`) 
}
