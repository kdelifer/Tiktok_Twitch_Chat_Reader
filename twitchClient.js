const EventEmitter = require("events");
const tmi = require('tmi.js');

class TwitchClient extends EventEmitter{

    constructor(opts) {
        super();
        // Create a client with our options
        this.client = new tmi.client(opts);

        // Bind the handlers to this class
        this.bindEventHandlers();
       
       // Register our event handlers
        this.registerEventHandlers();

        // Connect to Twitch
        this.client.connect();

    }

    bindEventHandlers() {
        this.onMessageHandler = this.onMessageHandler.bind(this);
        this.onConnectedHandler = this.onConnectedHandler.bind(this);
        this.onSubscriptionHandler = this.onSubscriptionHandler.bind(this);
        this.onResubHandler = this.onResubHandler.bind(this);
        this.onCheerHandler = this.onCheerHandler.bind(this);
        this.onHostedHandler = this.onHostedHandler.bind(this);
        this.onRaidedHandler = this.onRaidedHandler.bind(this);
        this.onSubgiftHandler = this.onSubgiftHandler.bind(this);
        this.onAnonsubgiftHandler = this.onAnonsubgiftHandler.bind(this);
        this.onSubmysterygiftHandler = this.onSubmysterygiftHandler.bind(this);
        this.onTimeoutHandler = this.onTimeoutHandler.bind(this);
        this.onBanHandler = this.onBanHandler.bind(this);
    }

    registerEventHandlers() {
        this.client.on('message', this.onMessageHandler);
        this.client.on('connected', this.onConnectedHandler);
        this.client.on('subscription', this.onSubscriptionHandler);
        this.client.on('resub', this.onResubHandler);
        this.client.on('cheer', this.onCheerHandler);
        this.client.on('hosted', this.onHostedHandler);
        this.client.on('raided', this.onRaidedHandler);
        this.client.on('subgift', this.onSubgiftHandler);
        this.client.on('anonsubgift', this.onAnonsubgiftHandler);
        this.client.on('submysterygift', this.onSubmysterygiftHandler);
        this.client.on('timeout', this.onTimeoutHandler);
        this.client.on('ban', this.onBanHandler);
    }

    // Called every time a message comes in
    onMessageHandler (channel, tags, message, self) {
        if (self) { return; } // Ignore messages from the bot

        let data = {channel: channel, tags: tags, message: message};
        let bundle = {platform: 'twitch', payload: data};

        this.emit('chat', bundle);
    }

    // Called every time the bot connects to Twitch chat
    onConnectedHandler (addr, port) {
        console.log(`* Connected to ${addr}:${port}`);
    }

    onSubscriptionHandler(channel, username, method, message, userstate) {
        //console.log(`${username} has subscribed to ${channel}`);
        this.emit('subscription', {channel, username, method, message, userstate});
    }

    onResubHandler(channel, username, months, message, userstate, methods) {
        //console.log(`${username} has resubscribed to ${channel} for ${months} months`);
        this.emit('resub', {channel, username, months, message, userstate, methods});
    }

    onCheerHandler(channel, userstate, message) {
        //console.log(`${userstate['display-name']} has cheered in ${channel}: ${message}`);
        this.emit('cheer', {channel, userstate, message});
    }

    onHostedHandler(channel, username, viewers, autohost) {
        //console.log(`${username} has hosted ${channel} with ${viewers} viewers`);
        this.emit('hosted', {channel, username, viewers, autohost});
    }

    onRaidedHandler(channel, username, viewers) {
        //console.log(`${username} has raided ${channel} with ${viewers} viewers`);
        this.emit('raided', {channel, username, viewers});
    }
    onSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
        //console.log(`${username} has gifted a sub to ${recipient} in ${channel}`);
        this.emit('subgift', {channel, username, streakMonths, recipient, methods, userstate});
    }

    onAnonsubgiftHandler(channel, streakMonths, recipient, methods, userstate) {
        //console.log(`An anonymous user has gifted a sub to ${recipient} in ${channel}`);
        this.emit('anonsubgift', {channel, streakMonths, recipient, methods, userstate});
    }

    onSubmysterygiftHandler(channel, username, numOfSubs, methods, userstate) {
        //console.log(`${username} has gifted ${numOfSubs} subs in ${channel}`);
        this.emit('submysterygift', {channel, username, numOfSubs, methods, userstate});
    }

    onTimeoutHandler(channel, username, reason, duration, userstate) {
        //console.log(`${username} has been timed out in ${channel} for ${duration} seconds`);
        this.emit('timeout', {channel, username, reason, duration, userstate});
    }

    onBanHandler(channel, username, reason, userstate) {
        //console.log(`${username} has been banned in ${channel}`);
        this.emit('ban', {channel, username, reason, userstate});
    }
}

module.exports = {
    TwitchClient
}