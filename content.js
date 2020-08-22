/**********************************************************************************************************
This sctipt reads and edits the HTML contetns of student.studentadmin.uconn.edu/. The actual page that needs
to be edited is inside of an iframe with the id 'ptifrmtgtframe'. Once this page loads, the script 
looks for the names of instructors which is stored in html span tags with ids: MTG_INSTR$0, MTG_INSTR$1, 
MTG_INSTR$3, etc. The second part of the script makes an ajax call to the database of ratemyprofessors(RMP)
with the instructor name and campus id. The campus id is passed into this script through the popup.js file.
Once the RMP database returns, the data is then parsed to a JSON object to either populate the studentadmin
span tags or be ignored.
***********************************************************************************************************/

$("#ptifrmtgtframe").ready(function() {
	var $instructors = [];
	var $names = [];
	var i = 0;
	var j = 0;
	
	//getting the html contents of each block of instructors from the iframe. $instructors holds
	//the contents of each block and $name holds the names of the instructors in each block.
	while($("#ptifrmtgtframe").contents().find("#MTG_INSTR\\$" + i).html() != undefined) {
		//$names = [[name1], [name1, name2, name3], [name1, name2], ...]
		$names[i] = [];
		j = 0;
		while(j < $("#ptifrmtgtframe").contents().find("#MTG_INSTR\\$" + i).html().split(/, <br>|<br>/).length) {
			$names[i][j] = $("#ptifrmtgtframe").contents().find("#MTG_INSTR\\$" + i).html().split(/, <br>|<br>/)[j].replace(/\r?\n|\r/, "");
			j++;
		}
		
		$instructors.push($("#ptifrmtgtframe").contents().find("#MTG_INSTR\\$" + i));
		i++;
	}
	
	//same thing as previous loop but on a different page
	while($("#ptifrmtgtframe").contents().find("#UC_STD_RC_DERIV_SSR_INSTR_LONG\\$" + i).html() != undefined) {
		$names[i] = [];
		j = 0;
		while(j < $("#ptifrmtgtframe").contents().find("#UC_STD_RC_DERIV_SSR_INSTR_LONG\\$" + i).html().split(/ \(SI\), <br>| \(PI\), <br>/).length) {
			$names[i][j] = $("#ptifrmtgtframe").contents().find("#UC_STD_RC_DERIV_SSR_INSTR_LONG\\$" + i).html().split(/ \(SI\), <br>| \(PI\), <br>/)[j].replace(/\(PI\)|\(SI\)|\r?\n|\r/, "");
			j++;
		}
		
		$instructors.push($("#ptifrmtgtframe").contents().find("#UC_STD_RC_DERIV_SSR_INSTR_LONG\\$" + i));
		i++;
		
	}
	
	
	//initializing newInfo. this will hold the information that will replace the current html in 
	//each instructor block. e.g. [[[rating, url]], [[rating, url], [rating, url], [rating, url]], [[raitng, url], [rating, url]], ....]
	var newInfo = new Array(i);
	for(var idx = 0; idx < $names.length; idx++) {
		newInfo[idx] = new Array(j);
		for(var idx1 = 0; idx1 < $names[idx].length; idx1++) {
			newInfo[idx][idx1] = new Array(2);
		}
	}
	
	ajaxCall();
	
	//run an ajax call to query the RMP database for data
	function ajaxCall() {
		$.each($names, async function(blockIndex, nameArr) {
			$.each(nameArr, async function(nameIndex, name) {
				$.when(scraper(name)).then(async function successHandler(data) {
					
					//trimming unnecessary characters on the ends of data so that it can be parsed as json object
					data = data.substring(5);
					data = data.substring(0, data.length - 1);
					var obj = JSON.parse(data);
				
					if(obj.response.numFound > 0) {
						if(obj.response.docs[0].averageratingscore_rf == undefined) {
							//if there are no ratings on the professor
							newInfo[blockIndex][nameIndex][0] = undefined;
						}else {
							//if a professor with ratings is found, add the rating and url of the first search result 
							//to newInfo
							newInfo[blockIndex][nameIndex][0] = obj.response.docs[0].averageratingscore_rf;
							newInfo[blockIndex][nameIndex][1] ="https://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + obj.response.docs[0].pk_id + "&showMyProfs=true";
							
							//send the data found to populate the page and wait for the process to complete
							await populateHTML(name, blockIndex, nameIndex, newInfo);
						}
					}
					else {
						//if the search results return no professors
						newInfo[blockIndex][nameIndex][0] = undefined;
					}
				});
			});
			
		});
	}
	
	//parse and populate the student admin page with new data
	function populateHTML(name, blockIndex, nameIndex, newInfo) {
		
		//this clears the current html data of the block if no data has been added before.
		//necessary when formating a block with multiple instructor names 
		if(!$instructors[blockIndex].html().includes("</a>")) {
			$instructors[blockIndex].html("");
		}
		
		var html = "<a href='" + newInfo[blockIndex][nameIndex][1] + "' target='_blank'>" + name + " " + newInfo[blockIndex][nameIndex][0] + "/5" + "</a>";
		if(newInfo[blockIndex].length > 1) {
			//if multoiple instructor names exist in a block, format html with a newline
			html = $instructors[blockIndex].html() + html + ", <br>";
		}
		
		//populate the page
		$instructors[blockIndex].html(html);
		return;
	}
});

//holds ajax info for scraping the RMP database
function scraper(name) {
	var firstLast = name.split(" ");
	var searchURL = "https://solr-aws-elb-production.ratemyprofessors.com/solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&q=" + firstLast[0] + "+" + firstLast[1] + "+AND+schoolid_s%3A" + campus + "&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=20&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s&fq=";
	return $.ajax({
		type: "GET",
		url: searchURL
	});
}