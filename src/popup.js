// Communication handling

var port = chrome.runtime.connect({name: "POPUP"});
var timetable = undefined;

port.onMessage.addListener(function (msg) {
    if(msg.type != "RESPONSE") {
        return;
    }

    if(msg.action == "GET_TIMETABLE" || msg.action == "UPDATE_TIMETABLE") {
        timetable = msg.content;
        console.log("[USTS] New timetable received.");
        makeCourses();
    }
})

// Color varants - grabbed from ust.space source code

var COLORS = ["#e74c3c", "#d35400", "#34495e", "#7f8c8d", "#d2527f", "#89729e", "#674172", "#4b77be", "#5b8930", "#407a52", "#6c7a89", "#666666"]

function adjustColor(e, t) {
    var n = !1;
    "#" == e[0] && (e = e.slice(1), n = !0);
    var i = parseInt(e, 16)
      , a = (i >> 16) + t;
    a > 255 ? a = 255 : 0 > a && (a = 0);
    var s = (i >> 8 & 255) + t;
    s > 255 ? s = 255 : 0 > s && (s = 0);
    var r = (255 & i) + t;
    return r > 255 ? r = 255 : 0 > r && (r = 0),
    (n ? "#" : "") + (r | s << 8 | a << 16).toString(16)
}

var adjust = {
    background: function (c) {return adjustColor(c, 100)},
    border: function (c) {return adjustColor(c, 50)},
    text: function (c) {return adjustColor(c, -30)}
}

// Messaging actions

function getTimetable() {
    port.postMessage({
        type: "REQUEST",
        action: "GET_TIMETABLE"
    });
}

function saveTimetable() {
    port.postMessage({
        type: "REQUEST",
        action: "SAVE_TIMETABLE"
    });
}

function updateTimetable() {
    port.postMessage({
        type: "REQUEST",
        action: "UPDATE_TIMETABLE"
    });
}

function changeColor(course, color) {
    port.postMessage({
        type: "REQUEST",
        action: "CHANGE_COLOR",
        param: {
            course: course,
            color: color
        }
    });
}

// DOM Manipulations


var selectedCourse = undefined;
var selectedColor = undefined;


function makeCourses() {
    var courseContainer = $("#course-container");
    courseContainer.empty();
    var courseItemTemplate = $("#course-item-template");
    var node = courseItemTemplate.prop("content");
    for (course in timetable) {
        var courseItem = $(node).clone();
        var name = course.slice(0, 4) + " " + course.slice(4);
        courseContainer.append(courseItem);
        courseItem = $(".course-item:last-child", courseContainer);
        courseItem.attr("id", course);
        courseItem.attr("data-course", course);
        var courseDot = $(".course-color-dot", courseItem);
        var courseName = $(".course-label", courseItem);
        courseDot.css("background-color", timetable[course]);
        courseName.text(name);
    }
    $(".course-item").click(function (e) {
        selectedCourse = e.target.dataset.course;
        selectedColor = timetable[selectedCourse];
        $(".course-item").removeClass("active");
        $(e.target).addClass("active");
        updateOptionCircle();
    })
    $(".course-item:first-child", courseContainer).click();
}

function updateCourseDots() {
    $(".course-item.active .course-color-dot").css("background-color", selectedColor);
}
function updateOptionCircle() {
    $(".option-color-circle").removeClass("active");
    $('.option-color-circle[data-color="${selectedColor}"]').addClass("active");
}

function makeOptions() {
    var optionContainer = $("#option-container");
    var optionItemTemplate = $("#option-item-template");
    var node = optionItemTemplate.prop("content");
    for (var i = 0; i < COLORS.length; i++) {
        var color = COLORS[i];
        var elem = $(node).clone();
        optionContainer.append(elem);
        elem = $(".option-color-circle:last-child", optionContainer);
        elem.attr("data-color", color);
        elem.css({
            backgroundColor: adjust.background(color),
            borderColor: adjust.border(color),
            color: adjust.text(color)
        })
    }
    $(".option-color-circle").click(function (e) {
        selectedColor = e.target.dataset.color;
        changeColor(selectedCourse, selectedColor);
        updateCourseDots();
        updateOptionCircle();
    })
}

// Event binder
$(document).ready(function () {
    getTimetable();
    makeOptions();
    $("#save-button").click(saveTimetable);
    $("#reset-button").click(function () {
        chrome.tabs.reload();
        window.close()
    });
    $("#close-button").click(function () {
        window.close();
    });
    $("#refresh-button").click(function () {
        updateTimetable();
    })
})
