function addContentScriptMessaging(extensionID) {
    var database = {
        hash: window.App.timetablePlanner.currentHash,
        name: undefined,
        data: undefined,
        update: function () {
            this.hash = window.App.timetablePlanner.currentHash;
            this.name = window.App.timetablePlanner.getTimetable(this.hash).title;
            var groups = window.App.timetablePlanner.timetable.getGroups();
            var tbas = window.App.timetablePlanner.timetable.getTBASections();
            var tba_id = Object();
            for (i in tbas) {
                tba_id[tbas[i].groupId] = true;
            }
            this.data = Object();
            for (i in groups) {
                if (!groups[i].getConstraint() && !tba_id[i]) {
                    this.data[groups[i].getSubject() + groups[i].getCode()] = groups[i];
                }
            }
        },
        generateColorData: function () {
            var d = Object();
            for (i in this.data) {
                d[i] = this.data[i].getColor();
            }
            return d;
        }
    };

    /* Establishing port connection between page and content script */
    var portToContentScript = chrome.runtime.connect(extensionID, {
        name: "PAGE"
    });

    /* Establishing message listener from extension popup */
    window.addEventListener("message", function(event) {
        if (event.source != window)
            return;
        
        console.log("[USTS] Message received from extension: " + event.data.action);
        if (event.data.action == "GET_TIMETABLE") {
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "GET_TIMETABLE",
                content: database.generateColorData()
            });
        } else if (event.data.action == "SAVE_TIMETABLE") {
            window.App.timetablePlanner.saveTimetable();
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "SAVE_TIMETABLE",
                content: true
            });
        } else if (event.data.action == "CHANGE_COLOR") {
            var course = event.data.param.course;
            var color = event.data.param.color;
            database.data[course].setColor(color);
            window.App.timetablePlanner.timetable.refresh();
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "CHANGE_COLOR",
                content: true
            });
        } else if (event.data.action == "UPDATE_TIMETABLE") {
            database.update();
            portToContentScript.postMessage({
                type: "RESPONSE",
                action: "UPDATE_TIMETABLE",
                content: database.generateColorData()
            });
        }
    }, false);

    /* Preparing data after the site script has done. */
    $(document).ready(function () {
        database.update();
        window.App.timetablePlanner.loadTimetable = (function wrapper(func) {
            function inner(e) {
                func.call(this, e);
                database.update();
                console.log("[USTS] Timetable change detected. The current is " + this.name);
            }
            return inner;
        })(window.App.timetablePlanner.loadTimetable);
    })
}

/* Code injector */

function injectAndExecute(func) {
    var script = document.createElement('script');
    script.textContent = "(" + func + ")('" + chrome.runtime.id +"');";
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    console.log("[USTS] Site is patched and ready to communicate with the extension!");
}

injectAndExecute(addContentScriptMessaging);
