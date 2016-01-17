'use strict';

/**
 * @function
 * @description Binds focusout event of postalCode field & binds click event of showMap button
 */
function initializeEvents() {
	var postalCodeField = $("input[id*='_shippingAddress_addressFields_postal']");
	$(postalCodeField).focusout(getPickUpPoints);

	$(document).on('click', '#showMap', loadMap);
}

/**
 * @function
 * @description Make Ajax call to Bring API Service & handle response
 */
function getPickUpPoints() {
	//Clear the pickup points div content
	if (typeof $('#pickup_points') !== "undefined" && $('#pickup_points').length) {
		$('#pickup_points').html('');
	}
	//Make call only if Bring API enable
	if (SitePreferences.ENABLE_BRING_API) {
		//Get required values
		var postalCode = $(this).val(),
			getPickUpPointUrl = Urls.getPickUpPoints;
		//Check if response is cached in localStorage & postalCode is entered by user
		if (getPickUpPointUrl.length > 0 && postalCode.length > 0 && !localStorage.hasOwnProperty(postalCode)) {
			$.ajax({
				   url: getPickUpPointUrl,
				   type: 'GET',
				   data: {
				      format: 'ajax',
				      postalCode : postalCode,
				   },
				   success: function(data) {
					   if (typeof data !== "undefined") {
						   //Process the response
						   processBringAPIResponse(data, postalCode);
					   }
				   },
				   error: function() {
				   },
			});
		} else {
			//Get value from localStorage
			var cachedBringResponse = localStorage.getItem(postalCode);
			if (typeof cachedBringResponse !== 'undefined') {
				var cachedBringResponseObject = JSON.parse(cachedBringResponse);
				if (!_IsEmpty(cachedBringResponseObject)) {
					processLatNLang(cachedBringResponseObject, false);
				}
			}
		}
	}
}

/**
 * @function
 * @description Process the response of Bring
 * @param {JSON} data - JSON
 * @param {String} postalCode - postal code
 */
function processBringAPIResponse (data, postalCode) {

	var bringAPIObject = JSON.parse(data),
		cache = {};
	//if response object is non-empty & has 'pickupPoint' attribute
	if (!_IsEmpty(bringAPIObject) && bringAPIObject.hasOwnProperty('pickupPoint')) {
		var pickupPointsObject = bringAPIObject['pickupPoint'];
		if (!_IsEmpty(pickupPointsObject)) {
			//Process LatnLang object
			var cache = processLatNLang(pickupPointsObject, true);
			//Cache the response of a particular postalCode in localStorage
			localStorage.setItem(postalCode, JSON.stringify(cache));
		}
	} else if(bringAPIObject.hasOwnProperty('error')) { //Handle invalid postal code error
		alert('Error calling BRING API Service, postalCode ' + bringAPIObject.error[0].error);
	} else { //Handle error
		alert('Error calling BRING API Service');
	}

}

/**
 * @function
 * @description Create dynamic divs & button
 * @param {String} latitude - latitude
 * @param {String} longitude - longitude
 */
function populateHTMLWithJSON (latitude, longitude) {

	var pickupDiv = $('#pickup_points');
	$('<div>', { 'class' : 'latitude', 'text' : latitude}).appendTo(pickupDiv);
	$('<div>', { 'class' : 'longitude', 'text' : longitude}).appendTo(pickupDiv);
	$('<button/>', { 'id':'showMap', 'data-latitude': latitude,'data-longitude': longitude,  'text': Resources.BUTTON_GMAP_TEXT}).appendTo(pickupDiv);
	$('<br>').appendTo(pickupDiv);
}

/**
 * @function
 * @description Extract lat n lang from response object
 * @param {Object} responseObject - Response
 * @param {Boolean} cacheIt - If true create a cache object to be saved in localStorage
 */
function processLatNLang (responseObject, cacheIt) {

	var cache = {};
	for (var index=0, len=Object.keys(responseObject).length; index<len; index++) {
		var latitude = responseObject[index].hasOwnProperty('latitude') ? responseObject[index]['latitude'] : '';
		var longitude = responseObject[index].hasOwnProperty('longitude') ? responseObject[index]['longitude'] : '';
		if (latitude != null && longitude != null) {
			if (cacheIt) {
				cache[index] = {};
				cache[index]['latitude']  = latitude;
				cache[index]['longitude'] = longitude;
			}
			populateHTMLWithJSON(latitude, longitude);
		}
	}
	if (cacheIt) {
		return cache;
	}

}

/**
 * @function
 * @description Inject Google Maps API Script in body
 */
function loadGMapScript() {
	if (typeof google === "undefined" || typeof google.maps === "undefined") {
	    var script = document.createElement("script");
	    script.type = "text/javascript";
	    script.src = SitePreferences.GOOGLE_MAPS_API_URL;
	    document.body.appendChild(script);
	}
}

/**
 * @function
 * @description Load/Display Google Map on button click
 */
function loadMap() {

	//Get lat n lang from 'data' attribute of button
	var lat = $(this).data('latitude');
	var lang = $(this).data('longitude');
	//Create center and mapOptions object
	var center = new google.maps.LatLng(lat, lang);
	var mapOptions = {
		center: center,
		zoom : 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	//Load map in div with id 'map'
	var map = new google.maps.Map($('#map')[0], mapOptions);

	//Create & Set Marker
	var marker=new google.maps.Marker({
		position:center
	});
	marker.setMap(map);
}
/**
 * @function
 * @description Check if object null or empty
 */
function _IsEmpty(obj) {
	return obj == null || Object.keys(obj).length == 0;
}

//Export functions
exports.init = function () {
	loadGMapScript();
	initializeEvents();
};
