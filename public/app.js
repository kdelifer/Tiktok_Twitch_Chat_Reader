// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Containers
let chatContainer;
let notificationContainer;


// TikTok live identifier
const uniqueId ='puhnoo';


$(document).ready(function() {
    chatContainer = $('.chatcontainer');
    notificationContainer = $('.notificationcontainer');

    // Check if user is near bottom of the container
    function isUserNearBottom(container) {
        const threshold = 100; // Pixels from the bottom to be considered "near the bottom"
        const currentPosition = container.scrollTop() + container.innerHeight();
        const containerHeight = container[0].scrollHeight;
    
        return (containerHeight - currentPosition) <= threshold;
    }

    // Counter
    let viewerCount = 0;
    let likeCount = 0;
    let diamondsCount = 0;

    // Check Duplicate
    let lastChatData = "";
    let lastGift = "";
    let lastSub = "";
    let lastResub = "";
    let lastCheer = "";
    let lastHosted = "";
    let lastRaided = "";

    // Duplication Manager
    let recentChats = [];
    let recentNotifs = [];
    let maxHistorySaved = 3;
    function addToChatContainer(html, container, messageId) {
        if (!recentChats.includes(messageId)) {
            // Check if the chat container has more than 500 messages
            if (container.find('div').length > 500) {
                container.find('div').slice(0, 200).remove();
            }
            container.find('.temporary').remove();
            container.append(html);

            // Animate scroll only if the user is not actively scrolling
            if (isUserNearBottom(container)) {
                container.stop().animate({
                    scrollTop: container[0].scrollHeight
                }, 400);
            }

            recentChats.push(messageId);

            // Keep only the latest chat items in history
            if (recentChats.length > maxHistorySaved) {
                recentChats.shift();
            }
        }
    }
    function addToNotifContainer(html, container) {
        if (!recentNotifs.includes(html)) {
            if (container.find('div').length > 200) {
                container.find('div').slice(0, 100).remove();
            }
            container.append(html);

            // Animate scroll only if the user is not actively scrolling
            if (isUserNearBottom(container)) {
                container.stop().animate({
                    scrollTop: container[0].scrollHeight
                }, 400);
            }
            recentNotifs.push(html);

            if (recentNotifs.length > maxHistorySaved) {
                recentNotifs.shift();
            }
        }
    }

    // These settings are defined by obs.html
    if (!window.settings) window.settings = {};

    $(document).ready(() => {
        /*$('#connectButton').click(connect);
        $('#uniqueIdInput').on('keyup', function (e) {
            if (e.key === 'Enter') {
                connect();
            }
        });*/
        connect();

        if (window.settings.username) connect();
    })

    function connect() {
        //let uniqueId = window.settings.username || $('#uniqueIdInput').val();
        if (uniqueId !== '') {

            $('#stateText').text('Connecting...');

            connection.connect(uniqueId, {
                enableExtendedGiftInfo: true
            }).then(state => {
                $('#stateText').text(`Connected to roomId ${state.roomId}`);

                // reset stats
                viewerCount = 0;
                likeCount = 0;
                diamondsCount = 0;
                updateRoomStats();

            }).catch(errorMessage => {
                $('#stateText').text(errorMessage);

                // schedule next try if obs username set
                if (window.settings.username) {
                    setTimeout(() => {
                        connect(window.settings.username);
                    }, 30000);
                }
            })

        } else {
            alert('no username entered');
        }
    }

    // Prevent Cross site scripting (XSS)
    function sanitize(text) {
        return text
            .replace(/&/g, '&amp;') // Must be done first!
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function updateRoomStats() {
        $('#roomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`)
    }

    function generateTiktokUsernameLink(data) {
        return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
    }

    function generateTwitchUsernameLink(username) {
        return `<a class="usernamelink" href="https://www.twitch.tv/${username}" target="_blank">${username}</a>`;
    }

    function isPendingStreak(data) {
        return data.giftType === 1 && !data.repeatEnd;
    }

    // viewer stats
    connection.on('roomUser', (msg) => {
        if (typeof msg.viewerCount === 'number') {
            viewerCount = msg.viewerCount;
            updateRoomStats();
        }
    })

    // like stats
    connection.on('like', (msg) => {
        if (typeof msg.totalLikeCount === 'number') {
            likeCount = msg.totalLikeCount;
            updateRoomStats();
        }

        if (window.settings.showLikes === "0") return;

        if (typeof msg.likeCount === 'number') {
            addTiktokChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
        }
    })

    // Member join
    let joinMsgDelay = 0;
    connection.on('member', (msg) => {
        if (window.settings.showJoins === "0") return;

        let addDelay = 250;
        if (joinMsgDelay > 500) addDelay = 100;
        if (joinMsgDelay > 1000) addDelay = 0;

        joinMsgDelay += addDelay;

        setTimeout(() => {
            joinMsgDelay -= addDelay;
            addTiktokChatItem('#21b2c2', msg, 'joined', true);
        }, joinMsgDelay);
    })

    // New chat comment received
    connection.on('chat', (msg) => {
        if (window.settings.showChats === "0") return;
        
        if (msg.platform == "twitch") {
            addTwitchChatItem(msg.payload);
        } else {
            addTiktokChatItem('', msg, msg.comment);
        }
    })

    // New gift received
    connection.on('gift', (data) => {
        if (!isPendingStreak(data) && data.diamondCount > 0) {
            diamondsCount += (data.diamondCount * data.repeatCount);
            updateRoomStats();
        }

        if (window.settings.showGifts === "0") return;

        addGiftItem(data);
    })

    // share, follow
    connection.on('social', (data) => {
        if (window.settings.showFollows === "0") return;

        let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
        addTiktokChatItem(color, data, data.label.replace('{0:user}', ''));
    })

    connection.on('streamEnd', () => {
        $('#stateText').text('Stream ended.');

        // schedule next try if obs username set
        if (window.settings.username) {
            setTimeout(() => {
                connect(window.settings.username);
            }, 30000);
        }
    })

    // Twitch
    connection.on('subscription', (data) => {
        // Check if subscription display is enabled in settings
        if (window.settings.showSubscriptions !== "0") {
            console.log(data);
            addSubscriptionItem(data);
        }
    });
    function isSubscriptionStreak(data) {
        // You can implement logic here to determine if the subscription is part of a streak
        // This is dependent on how you want to handle subscription streaks.
        return data.method && data.method.prime; // Example condition
    }

    // Twitch
    connection.on('resub', (data) => {
        // Check if resubscription display is enabled in settings
        if (window.settings.showResubs !== "0") {
            //console.log(data);
            addResubItem(data);
        }
    });
    function isResubStreak(data) {
        // Implement any specific logic you want for identifying streaks in resubscriptions.
        return data.months > 1; // Example: considering it a streak if it's more than 1 month
    }

    // Twitch
    connection.on('cheer', (data) => {
        // Check if cheer display is enabled in settings
        if (window.settings.showCheers !== "0") {
            addCheerItem(data);
        }
    });
    function formatCheerMessage(userstate, message) {
        // You can add logic here to format the cheer message, 
        // e.g., highlighting the number of bits cheered
        return `${userstate['display-name']} cheered: ${message}`;
    }

    //Twitch
    connection.on('hosted', (data) => {
        // Check if hosted event display is enabled in settings
        if (window.settings.showHosts !== "0") {
            addHostedItem(data);
        }
    });
    function formatHostMessage(data) {
        // Format the host message as desired
        return `${generateTwitchUsernameLink(data.username)} has hosted ${data.channel} with ${data.viewers} viewers${data.autohost ? ' (autohost)' : ''}`;
    }

    //Twitch
    connection.on('raided', (data) => {
        // Check if raid event display is enabled in settings
        if (window.settings.showRaids !== "0") {
            addRaidedItem(data);
        }
    });
    function formatRaidMessage(data) {
        // Format the raid message as desired
        return `${generateTwitchUsernameLink(data.username)} has raided ${data.channel} with ${data.viewers} viewers`;
    }

    // Twitch
    connection.on('subgift', (data) => {
        // Check if subgift event display is enabled in settings
        if (window.settings.showSubgifts !== "0") {
            addSubgiftItem(data);
        }
    });
    function formatSubgiftMessage(data) {
        // Format the subgift message as desired
        return `${generateTwitchUsernameLink(data.username)} has gifted a subscription to ${generateTwitchUsernameLink(data.recipient)} in ${data.channel} for ${data.streakMonths} months`;
    }

    // Twitch
    connection.on('anonsubgift', (data) => {
        // Check if anonymous subgift event display is enabled in settings
        if (window.settings.showAnonSubgifts !== "0") {
            addAnonSubgiftItem(data);
        }
    });
    function formatAnonSubgiftMessage(data) {
        // Format the anonymous subgift message as desired
        return `An anonymous user has gifted a subscription to ${generateTwitchUsernameLink(data.recipient)} in ${data.channel} for ${data.streakMonths} months`;
    }

    // Twitch
    connection.on('submysterygift', (data) => {
        if (window.settings.showSubmysterygifts !== "0") {
            addSubmysterygiftItem(data);
        }
    });
    function formatSubmysterygiftMessage(data) {
        return `${generateTwitchUsernameLink(data.username)} has gifted ${data.numOfSubs} subs in ${data.channel}`;
    }

    // Twitch
    connection.on('timeout', (data) => {
        if (window.settings.showTimeouts !== "0") {
            addTimeoutItem(data);
        }
    });
    function formatTimeoutMessage(data) {
        // Format the timeout message as desired
        return `${generateTwitchUsernameLink(data.username)} has been timed out in ${data.channel} for ${data.duration} seconds${data.reason ? `: ${data.reason}` : ''}`;
    }

    // Twitch
    connection.on('ban', (data) => {
        if (window.settings.showBans !== "0") {
            addBanItem(data);
        }
    });
    function formatBanMessage(data) {
        // Format the ban message as desired
        return `${generateTwitchUsernameLink(data.username)} has been banned in ${data.channel}${data.reason ? `: ${data.reason}` : ''}`;
    }


    /**
     * Add a new message to the chat container
     */
    function addTiktokChatItem(color, data, text, summarize) {

        let html = `
            <div class=${summarize ? 'temporary' : 'static'}>
                <img class="miniprofilepicture" src="${data.profilePictureUrl}">
                <span>
                    <b>${generateTiktokUsernameLink(data)}:</b> 
                    <span style="color:${color}">${sanitize(text)}</span>
                </span>
            </div>
        `;
        addToChatContainer(html, chatContainer, data.msgId);
    }

    /**
     * Add a new Twitch message to the chat container
     */
    function addTwitchChatItem(payload) {
        // Placeholder Twitch profile image
        let twitchImgSrc = 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png'
        let displayName = payload.tags['display-name'] ? payload.tags['display-name'] : payload.tags.username;
        let html =`
            <div class='static'>
                <img class="miniprofilepicture" src="${twitchImgSrc}">
                <span>
                    <b>${generateTwitchUsernameLink(displayName)}:</b> 
                    <span>${sanitize(payload.message)}</span>
                </span>
            </div>
        `;
        addToChatContainer(html, chatContainer, payload.tags.id);
    }

    /**
     * Add a new gift to the gift container
     */
    function addGiftItem(data) {
        let streakId = data.userId.toString() + '_' + data.giftId;

        let html = `
            <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
                <img class="miniprofilepicture" src="${data.profilePictureUrl}">
                <span>
                    <b>${generateTiktokUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                    <div>
                        <table>
                            <tr>
                                <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                                <td>
                                    <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                    <span>Repeat: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                    <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                                </td>
                            </tr>
                        </tabl>
                    </div>
                </span>
            </div>
        `;

        let existingStreakItem = notificationContainer.find(`[data-streakid='${streakId}']`);

        if (existingStreakItem.length) {
            existingStreakItem.replaceWith(html);
        } else {
            addToNotifContainer(html, notificationContainer);
        }
    }

    function addSubscriptionItem(data) {
        // Example HTML structure for a subscription item
        let twitchSysMessage = data.userstate["system-msg"].split(' ').slice(1).join(' ').trim();
        let html = `
            <div class="${isSubscriptionStreak(data) ? 'streak' : 'normal'}">
                <span>
                    <b>${generateTwitchUsernameLink(data.username)}:</b> ${twitchSysMessage}
                    ${data.message ? `<br><span>Message: <b>${data.message}</b></span>` : ''}
                </span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addResubItem(data) {
        // Example HTML structure for a resubscription item
        let twitchSysMessage = data.userstate["system-msg"].split(' ').slice(1).join(' ').trim();
        let html = `
            <div class="${isResubStreak(data) ? 'streak' : 'normal'}">
                <span>
                    <b>${generateTwitchUsernameLink(data.username)}:</b> ${twitchSysMessage}
                    ${data.message ? `<br><span>Message: <b>${data.message}</b></span>` : ''}
                </span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addCheerItem(data) {
        // Example HTML structure for a cheer item
        let formattedMessage = formatCheerMessage(data.userstate, data.message);
        let html = `
            <div class="cheer-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addHostedItem(data) {
        // Example HTML structure for a hosted event
        let formattedMessage = formatHostMessage(data);
        let html = `
            <div class="hosted-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addRaidedItem(data) {
        // Example HTML structure for a raid event
        let formattedMessage = formatRaidMessage(data);
        let html = `
            <div class="raid-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addSubgiftItem(data) {
        // Example HTML structure for a subgift event
        let formattedMessage = formatSubgiftMessage(data);
        let html = `
            <div class="subgift-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addAnonSubgiftItem(data) {
        // Example HTML structure for an anonymous subgift event
        let formattedMessage = formatAnonSubgiftMessage(data);
        let html = `
            <div class="anonsubgift-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addSubmysterygiftItem(data) {
        // Example HTML structure for a submysterygift event
        let formattedMessage = formatSubmysterygiftMessage(data);
        let html = `
            <div class="submysterygift-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addTimeoutItem(data) {
        // Example HTML structure for a timeout event
        let formattedMessage = formatTimeoutMessage(data);
        let html = `
            <div class="timeout-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }

    function addBanItem(data) {
        // Example HTML structure for a ban event
        let formattedMessage = formatBanMessage(data);
        let html = `
            <div class="ban-message">
                <span>${formattedMessage}</span>
            </div>
        `;

        addToNotifContainer(html, notificationContainer);
    }
});

