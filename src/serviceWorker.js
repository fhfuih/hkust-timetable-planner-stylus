/** @type {chrome.runtime.Port?} */
let portToPage = null;

chrome.runtime.onConnectExternal.addListener((port) => {
    console.debug('[Timetable Ext] serviceWorker received connection from port', port.name)
    if (port.name != "PAGE") return;
    portToPage = port;
    port.onMessage.addListener(function (msg) {
        const { action } = msg;
        switch(action) {
            case 'PING':
                console.debug('[Timetable Ext] serviceWorker received PING from', port.name)
                port.postMessage({ action: 'PONG' })
                return;
            default: {
                chrome.runtime.sendMessage(msg);
            }
        }
    });
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const { action } = msg;
    const from = sender.tab?.index ?? sender.url
    switch(action) {
        case 'PING':
            console.debug('[Timetable Ext] serviceWorker received PING from', from)
            sendResponse({ action: 'PONG' })
            return;
        default: {
            if (!portToPage) {
                console.debug('[Timetable Ext] serviceWorker received', msg, 'from', from, 'but CANNOT forward to page')
                return;
            }
            console.debug('[Timetable Ext] serviceWorker received', msg, 'from', from, 'and forward to page')
            portToPage.postMessage(msg);
        }
    }
})