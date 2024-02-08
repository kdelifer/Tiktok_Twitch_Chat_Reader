# Tiktok_Twitch_Chat_-_Reader
A chat reader for <a href="https://www.tiktok.com/live">TikTok LIVE</a> and Twitch utilizing <a href="https://github.com/zerodytrash/TikTok-Live-Connector">TikTok-Live-Connector</a>, <a href="https://tmijs.com">Tmi.js</a>, and <a href="https://socket.io/">Socket.IO</a> to forward the data to the client. This demo project uses the unofficial TikTok API to retrieve chat comments, gifts and other events from TikTok LIVE.

Forked from the project: https://tiktok-chat-reader.zerody.one/

## Installation
To run the chat reader locally, follow these steps:

1. Download Node.js LTS from https://nodejs.org/
2. Install
3. Open Windows Powershell
4. Navigate to the “server.js” file in Powershell
5. Use command “cd .\Downloads\TikTok_Twitch_Chat_Reader\”. If the folder is in Documents or Desktop, use “cd .\Documents\TikTok_Twitch_Chat_Reader\” or “cd .\Desktop\TikTok_Twitch_Chat_Reader\". Pressing TAB will autocomplete.
6. Run the command: npm i
7. Run the command: node server.js
8. Open http://localhost:8081/

## Configuration
Twitch channel is set in config.js (twitchOpts.channels). Tiktok live is set in app.js (uniqueId).


Now you should see the following message: `Server running! Please visit http://localhost:8081/`<br>
Simply open http://localhost:8081/ in your browser. Thats it.