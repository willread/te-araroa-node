var $ = require("jquery");
var request = require("request");
var fs = require("fs");

var start = "http://www.teararoa.org.nz/northisland/";
			// "http://www.teararoa.org.nz/southisland/";
			
var output = {};

request(start, function(err, response, body){
	console.log("Loaded initial page");
	var groups = $(body).find(".hasChildAct .leftmenunav .page");
	output.groups = [];
	$(groups).each(function(groupIndex, value){
		var groupUrl = $(value).find("a").attr("href");
		var groupName = $(value).find("a").html();
		request(groupUrl, function(err, response, body){
			console.log("Loaded group: " + groupName);
			var groupDescription = $(body).find("#contentright table[cellpadding=5] tr:nth-child(2) td:nth-child(1)").text();
			output.groups[groupIndex] = {
				name: groupName,
				description: groupDescription,
				tracks: []
			};
			var rows = $(body).find("table[cellpadding=4] tr");
			$(rows).each(function(rowIndex, value){
				var trackUrls = $(value).find("a");
				if(trackUrls.length > 0){
					var trackUrl = $(trackUrls[0]).attr("href");
					var trackName = $(trackUrls[0]).html();
					var bypassUrl, bypassName;
					if(trackUrls.length == 2){
						bypassUrl = $(trackUrls[1]).attr("href");
						bypassName = $(trackUrls[1]).html();
					}
					output.groups[groupIndex].tracks[rowIndex] = {
						name: trackName,
						url: trackUrl,
						bypass: {
							name: bypassName,
							url: bypassUrl
						}
					};
					request(trackUrl, function(err, request, body){
						console.log("Loaded track: " + trackName);
						// TODO: Get map ID
						var track = output.groups[groupIndex].tracks[rowIndex];
						track.fields = {
							Status: $($(body).find(".track-status")).text()
						}
						$($(body).find("td[colspan=2] .track-field")).each(function(fieldIndex, value){
							track.fields[$(value).text()] = $($(body).find(".track-field")[fieldIndex]).next().html();
						});
						// TODO: Comments
					});
					if(bypassUrl){
						request(bypassUrl, function(err, request, body){
							console.log("Loaded bypass: " + bypassName);
							// TODO: Get map ID
							var bypass = output.groups[groupIndex].tracks[rowIndex].bypass;
							bypass.fields = {
								Status: $($(body).find(".track-status")).text()
							}
							$($(body).find("td[colspan=2] .track-field")).each(function(fieldIndex, value){
								bypass.fields[$(value).text()] = $($(body).find(".track-field")[fieldIndex]).next().html();
							});
							// TODO: Comments
						});
					}
				}
			});
		});
	});
});

process.on("exit", function() {
	var string = "<!doctype html><html><body>"; 
	for(var g = 0; g < output.groups.length; g++){
		var group = output.groups[g];
		string += "<h1>" + group.name + "</h1>";
		string += "<hr/>";
		string += "<b>" + group.description + "</b>";
		for(var t = 0; t < group.tracks.length; t++){
			var track = group.tracks[t];
			if(track){
				string += "<h2>" + track.name + "</h2>";
				string += "<hr/>";
				if(track.fields){
					for(var f in track.fields){
						var field = track.fields[f];
						string += "<b>" + f + ": </b>" + field + "<br />";
					}
				}
				if(track.bypass && track.bypass.name){
					var bypass = track.bypass;
					string += "<h2>BYPASS: " + bypass.name + "</h2>";
					string += "<hr/>";
					if(bypass.fields){
						for(var f in bypass.fields){
							var field = bypass.fields[f];
							string += "<b>" + f + ": </b>" + field + "<br />";
						}
					}
				}
			}
		}
	}
	string += "</body></html>";
	console.log("Writing HTML to Te-Araroa-Notes.html");
	fs.writeFileSync("Te-Araroa-Notes.html", string, "utf8");
});