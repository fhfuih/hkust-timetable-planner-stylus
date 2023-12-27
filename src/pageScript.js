console.debug('[Timetable Ext] extension pageScript loaded')
const extensionID = 'pbbjlnfhpadekbhpghlffmnekojomdjg'

// Data
const database = {
    // Lazy load the data because the data is not ready right after the page is loaded
    /** @type {string?} The hash of the current timetable (random string) */
    _hash: null,
    /** @type {string?} The name of the current timetable (default "Untitled Timetable") */
    _name: null,
    /** @type {Object<string,Object>?} */
    _data: null,
    get hash() {
        if (this._hash == null) this.update();
        return this._hash;
    },
    get name() {
        if (!this._name == null) this.update();
        return this._name;
    },
    get data() {
        if (!this._data == null) this.update();
        return this._data;
    },
    update: function () {
        this._hash = window.App.timetablePlanner.currentHash;
        this._name = window.App.timetablePlanner.getTimetable(this._hash).title;
        // Get all sections
        const groups = window.App.timetablePlanner.timetable.getGroups();
        // Get TBA sections
        const tbas = window.App.timetablePlanner.timetable.getTBASections();
        const tba_id = {};
        for (i in tbas) {
            tba_id[tbas[i].groupId] = true;
        }
        // Get sections, excluding TBA, manual constraints, and temporary
        this._data = {};
        for (i in groups) {
            const g = groups[i]
            if (!g.getConstraint() && !g.getTemporary() && !tba_id[i]) {
                this._data[g.getSubject() + g.getCode()] = g;
            }
        }
    },
    generateColorData: function () {
        const d = {};
        for (i in this.data) {
            d[i] = this.data[i].getColor();
        }
        return d;
    }
};

// Hook timetable changes
window.App.timetablePlanner.loadTimetable = (function wrapper(func) {
    function inner(e) {
        func.call(this, e);
        database.update();
        console.debug("[Timetable Ext] Timetable change detected. The current is", this.name );
    }
    return inner;
})(window.App.timetablePlanner.loadTimetable);
document.getElementById("semester").addEventListener("semester-changed", function() {
    database.update();
    console.debug("[Timetable Ext] Timetable change detected");
})

// Messaging
const portToContentScript = chrome.runtime.connect(extensionID, {
    name: "PAGE"
});
portToContentScript.onMessage.addListener((message, port) => {
    console.debug('[Timetable Ext] pageScript received message', message, 'from port', port.name)
    switch(message.action) {
        case "UPDATE_TIMETABLE":
            database.update();
            // And it will continue...
        case "GET_TIMETABLE":
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: message.action,
                content: database.generateColorData()
            });
            break;
        case "SAVE_TIMETABLE":
            window.App.timetablePlanner.saveTimetable();
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "SAVE_TIMETABLE",
                content: true
            });
            break;
        case "CHANGE_COLOR":
            var {course, color} = message.param;
            database.data[course].setColor(color);
            window.App.timetablePlanner.timetable.refresh();
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "CHANGE_COLOR",
                content: true
            });
            break;
    }
})

portToContentScript.postMessage({ action: 'PING' })
