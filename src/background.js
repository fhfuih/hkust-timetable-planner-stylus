/* Enable popup on specified page */

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'ust.space', pathEquals: '/planner'},
            })
            ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

/* Listen messages from extension popup */

var registeredPorts = {};

chrome.runtime.onConnect.addListener(function(port) {
    registeredPorts[port.name] = port;
    if (port.name == "POPUP") {
        port.onMessage.addListener(function (msg) {
            if(msg.type == "REQUEST") {
                registeredPorts.CONTENT.postMessage(msg);
            }
        })

    } 
    // else if (port.name == "CONTENT") {}
});

/* Listen messages from webpage */

chrome.runtime.onConnectExternal.addListener(function (port) {
    if (port.name != "PAGE") {
        return;
    }

    port.onMessage.addListener(function (msg) {
        registeredPorts.POPUP.postMessage(msg);
    });
})
