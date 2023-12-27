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

// UI Initialization
getOrUpdateTimetable(false);
makeColorCircles();
const pickr = Pickr.create({
    el: '.color-picker',
    // container: '.color-picker-app',
    theme: 'nano',
    appClass: 'color-picker-app',
    inline: true,
    showAlways: true,
    useAsButton: true,
    autoReposition: false,
    lockOpacity: true,
    comparison: false,
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            input: true,
        }
    },
    swatches: COLORS,
})
pickr
    .on('change', throttle(handleColorPickerChange, 100))
    .on('changestop', handleColorPickerChangeStop)
    .on('swatchselect', handleColorPickerChangeStop)
    .on('init', () => {
    const swatchButtons = document.querySelectorAll(".pcr-swatches button");
    swatchButtons.forEach(function (e, i) {
        const color = COLORS[i];
        const backgroundColor = adjustColor(color, "background");
        const textColor = adjustColor(color, "text");
        const borderColor = adjustColor(color, "border");
        e.style.setProperty('--pcr-color', `radial-gradient(circle at center, ${textColor}, ${textColor} 30%, ${backgroundColor} 30%, ${backgroundColor} 80%, ${borderColor} 80%)`);
    })
})

// Popup page DOM Manipulations
document.addEventListener("click", function (e) {
    if (e.target.matches(".course-item")) {
        selectCourse(e);
    } else if (e.target.matches(".option-color-circle")) {
        selectColorCircle(e);
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

/** @param {HTMLElement} e The course item in the list */
function selectCourse(e) {
    selectedCourse = e.target.dataset.course;
    selectedColor = timetable[selectedCourse];
    document.querySelectorAll(".course-item").forEach(function (e) {
        e.classList.remove("active");
    });
    e.target.classList.add("active");
    updateColorCircles();
    updateColorPicker();
}

/** @param {HTMLElement} e The color circle in the grid */
function selectColorCircle(e) {
    selectedColor = e.target.dataset.color;
    updateColorCircles();
    applyChanges();
}

function handleColorPickerChange(c) {
    const color = c.toHEXA().toString();
    const backgroundColor = adjustColor(color, "background");
    const borderColor = adjustColor(color, "border");
    const textColor = adjustColor(color, "text");
    document.querySelector(".timetable-example").style.backgroundColor = backgroundColor;
    document.querySelector(".timetable-example").style.borderColor = borderColor;
    document.querySelector(".timetable-example").style.color = textColor;
}

function handleColorPickerChangeStop(_, instance) {
    const color = instance.getColor().toHEXA().toString();
    selectedColor = color;
    applyChanges();
}

function applyChanges() {
    updateCourseDots();
    changeColor(selectedCourse, selectedColor);
}

function updateCourseDots() {
    document.querySelector(".course-item.active .course-color-dot").style.backgroundColor = selectedColor;
}

function updateColorCircles() {
    document.querySelectorAll(".option-color-circle").forEach(function (e) {
        e.classList.remove("active");
    })
    const matchingColorCircle = document.querySelector(`.option-color-circle[data-color="${selectedColor}"]`)
    if (matchingColorCircle) matchingColorCircle.classList.add("active");
}

function updateColorPicker() {
    pickr.setColor(selectedColor)
}

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

function makeColorCircles() {
    const optionContainer = document.getElementById("option-container");
    /** @type HTMLTemplateElement */
    const optionItemTemplate = document.getElementById("option-item-template");
    const node = optionItemTemplate.content;
    for (let i = 0; i < COLORS.length; i++) {
        const color = COLORS[i];
        const clone = node.cloneNode(true);
        const elem = clone.querySelector(".option-color-circle");
        elem.setAttribute("data-color", color);
        elem.style.backgroundColor = adjustColor(color, "background");
        elem.style.borderColor = adjustColor(color, "border");
        elem.style.color = adjustColor(color, "text");
        optionContainer.append(clone);
    }
}

// Utilities
/**
 * Color variants - grabbed from ust.space source code
 * @param {string} color The color to adjust
 * @param {number|'background'|'border'|'text'} adjust The amount to adjust
 */
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

/**
 * @param {Function} func The function to throttle
 * @param {number} limit The time limit in ms
 */
function throttle(func, limit) {
    let inThrottle
    return function() {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}
