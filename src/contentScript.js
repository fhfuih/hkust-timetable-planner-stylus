

var port = chrome.runtime.connect({name: "CONTENT"});

port.onMessage.addListener(function (msg) {
    window.postMessage(msg, "*")
})

console.log('[USTS] The channel between the site and the extension is established!');
