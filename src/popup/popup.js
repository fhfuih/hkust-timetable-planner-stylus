// Global variables
let timetable = undefined;
let selectedCourse = undefined;
let selectedColor = undefined;
const COLORS = ["#e74c3c", "#d35400", "#34495e", "#7f8c8d", "#d2527f", "#89729e", "#674172", "#4b77be", "#5b8930", "#407a52", "#6c7a89", "#666666"]

// Communication handling
chrome.runtime.sendMessage({ action: "PING" })
chrome.runtime.onMessage.addListener(function (msg) {
    if(msg.type != "RESPONSE") return;
    if(msg.action == "GET_TIMETABLE" || msg.action == "UPDATE_TIMETABLE") {
        timetable = msg.content;
        makeCourses();
    }
})
function getOrUpdateTimetable(isUpdate) {
    chrome.runtime.sendMessage({
        type: "REQUEST",
        action: isUpdate ? "UPDATE_TIMETABLE" : "GET_TIMETABLE"
    });
}
function saveTimetable() {
    chrome.runtime.sendMessage({
        type: "REQUEST",
        action: "SAVE_TIMETABLE"
    });
}
function changeColor(course, color) {
    chrome.runtime.sendMessage({
        type: "REQUEST",
        action: "CHANGE_COLOR",
        param: {
            course: course,
            color: color
        }
    });
}

// Color variants - grabbed from ust.space source code
function adjustColor(color, adjust) {
    switch (adjust) {
        case "background":
            return adjustColor(color, 100)
        case "border":
            return adjustColor(color, 50)
        case "text":
            return adjustColor(color, -30)
        default:
            var n = !1;
            "#" == color[0] && (color = color.slice(1), n = !0);
            var i = parseInt(color, 16)
            , a = (i >> 16) + adjust;
            a > 255 ? a = 255 : 0 > a && (a = 0);
            var s = (i >> 8 & 255) + adjust;
            s > 255 ? s = 255 : 0 > s && (s = 0);
            var r = (255 & i) + adjust;
            return r > 255 ? r = 255 : 0 > r && (r = 0),
            (n ? "#" : "") + (r | s << 8 | a << 16).toString(16)
    }
}

// Popup page DOM Manipulations
document.addEventListener("click", function (e) {
    if (e.target.matches(".course-item")) {
        selectedCourse = e.target.dataset.course;
        selectedColor = timetable[selectedCourse];
        document.querySelectorAll(".course-item").forEach(function (e) {
            e.classList.remove("active");
        })
        e.target.classList.add("active");
        updateOptionCircle();
    } else if (e.target.matches(".option-color-circle")) {
        selectedColor = e.target.dataset.color;
        changeColor(selectedCourse, selectedColor);
        updateCourseDots();
        updateOptionCircle();
    }
})
document.getElementById("save-button").addEventListener("click", saveTimetable);
document.getElementById("reset-button").addEventListener("click", function () {
    chrome.tabs.reload();
    window.close()
});
document.getElementById("close-button").addEventListener("click", function () {
    window.close();
});
document.getElementById("refresh-button").addEventListener("click", function () {
    getOrUpdateTimetable(true);
})

function makeCourses() {
    const courseContainer = document.getElementById("course-container");
    courseContainer.innerHTML = "";
    /** @type HTMLTemplateElement */
    const courseItemTemplate = document.getElementById("course-item-template");
    const node = courseItemTemplate.content;
    for (course in timetable) {
        const name = course.slice(0, 4) + " " + course.slice(4);
        const clone = node.cloneNode(true);
        const courseItem = clone.firstElementChild;
        courseItem.id = course;
        courseContainer.append(clone);
        courseItem.setAttribute("data-course", course);
        courseItem.querySelector(".course-color-dot").style.backgroundColor = timetable[course];
        courseItem.querySelector(".course-label").innerText = name;
    }
    document.querySelector(".course-item:first-child")?.click();
}

function updateCourseDots() {
    document.querySelector(".course-item.active .course-color-dot").style.backgroundColor = selectedColor;
}

function updateOptionCircle() {
    document.querySelectorAll(".option-color-circle").forEach(function (e) {
        e.classList.remove("active");
    })
    document.querySelector(`.option-color-circle[data-color="${selectedColor}"]`).classList.add("active");
}

function makeOptions() {
    const optionContainer = document.getElementById("option-container");
    /** @type HTMLTemplateElement */
    const optionItemTemplate = document.getElementById("option-item-template");
    const node = optionItemTemplate.content;
    for (let i = 0; i < COLORS.length; i++) {
        const color = COLORS[i];
        const clone = node.cloneNode(true);
        const elem = clone.firstElementChild;
        elem.setAttribute("data-color", color);
        elem.style.backgroundColor = adjustColor(color, "background");
        elem.style.borderColor = adjustColor(color, "border");
        elem.style.color = adjustColor(color, "text");
        optionContainer.append(clone);
    }
}

// On load
getOrUpdateTimetable(false);
makeOptions();
