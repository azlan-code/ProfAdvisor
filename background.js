//adding new rule: allow extension to be accessable only from the stdudentadmin page
chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [
				new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {urlContains: "student.studentadmin.uconn.edu"},
				})
			],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
});