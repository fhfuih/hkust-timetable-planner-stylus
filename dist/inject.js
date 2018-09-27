function addContentScriptMessaging(e){var n={hash:window.App.timetablePlanner.currentHash,name:void 0,data:void 0,update:function(){this.hash=window.App.timetablePlanner.currentHash,this.name=window.App.timetablePlanner.getTimetable(this.hash).title;var e=window.App.timetablePlanner.timetable.getGroups(),t=window.App.timetablePlanner.timetable.getTBASections(),a=Object();for(i in t)a[t[i].groupId]=!0;for(i in this.data=Object(),e)e[i].getConstraint()||a[i]||(this.data[e[i].getSubject()+e[i].getCode()]=e[i])},generateColorData:function(){var e=Object();for(i in this.data)e[i]=this.data[i].getColor();return e}},o=chrome.runtime.connect(e,{name:"PAGE"});window.addEventListener("message",function(e){if(e.source==window)if(console.log("[USTS] Message received from extension: "+e.data.action),"GET_TIMETABLE"==e.data.action)o.postMessage({type:"RESPONSE",action:"GET_TIMETABLE",content:n.generateColorData()});else if("SAVE_TIMETABLE"==e.data.action)window.App.timetablePlanner.saveTimetable(),o.postMessage({type:"RESPONSE",action:"SAVE_TIMETABLE",content:!0});else if("CHANGE_COLOR"==e.data.action){var t=e.data.param.course,a=e.data.param.color;n.data[t].setColor(a),window.App.timetablePlanner.timetable.refresh(),o.postMessage({type:"RESPONSE",action:"CHANGE_COLOR",content:!0})}else"UPDATE_TIMETABLE"==e.data.action&&(n.update(),o.postMessage({type:"RESPONSE",action:"UPDATE_TIMETABLE",content:n.generateColorData()}))},!1),$(document).ready(function(){var t;n.update(),window.App.timetablePlanner.loadTimetable=(t=window.App.timetablePlanner.loadTimetable,function(e){t.call(this,e),n.update(),console.log("[USTS] Timetable change detected. The current is "+this.name)})})}function injectAndExecute(e){var t=document.createElement("script");t.textContent="("+e+")('"+chrome.runtime.id+"');",(document.head||document.documentElement).appendChild(t),t.remove(),console.log("[USTS] Site is patched and ready to communicate with the extension!")}injectAndExecute(addContentScriptMessaging);