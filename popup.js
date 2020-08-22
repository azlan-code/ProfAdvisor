//run content.js and pass the value of dropdown menu after button click 
document.addEventListener('DOMContentLoaded', function() {
	document.getElementById("btn").addEventListener("click", function() {
		var dropdown = document.getElementById("campus");
		var campus = dropdown.options[dropdown.selectedIndex].value;
		
		chrome.tabs.executeScript( {file: "jquery-3.5.1.min.js"}, function() {
			chrome.tabs.executeScript( {
				code: "var campus = " + JSON.stringify(campus)
			}, function() {
				chrome.tabs.executeScript( {file: "content.js"});
			});
			
		});
	});
});
