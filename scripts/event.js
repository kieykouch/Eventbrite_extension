var Event = (function() {

    //Private Variables
    var apiUrl = 'https://www.eventbriteapi.com/v3/events/search/';
    var TOKEN = 'BKKRDKVUVRC5WG4HAVLT'; // token for the OAuth token
    var Max_Description_Lenght = 350; // max length for description
  
    var events; // events container, value set in the "start" method below
    var search; // search form, value set in the "start" method below
    var eventTemplateHtml; // a template for creating events. Read from index.html
    var standbyMsg; // searchin container, value set in the "start" method below
    var ErrorMsg; // All error message container    
    var previoussearch = {}; // track record for previous search
    var options = {
                token: TOKEN,
                popular: true,
                'venue.city': null,
                'venue.region': null,
                sort_by: "date"
              }; // a temple for option sending to server

    //Private Methods

    /**
     * Insert event into events container in UI
     * @param  {Object}  event       event JSON
     * @return {None}
     */
    var insertEvent = function(event) {
        // Start with the template, make a new DOM element using jQuery
        var newElem = $(eventTemplateHtml);
        newElem.attr('id', event.id);
        newElem.attr('href', event.url);
        newElem.find('.title').text(event.name.text);
        if (!event.description.text){
          newElem.find(".description").text("Couldn't find description.");
        }
        else if (event.description.text.length > Max_Description_Lenght){
          newElem.find(".description").text(event.description.text.substring(0,Max_Description_Lenght)+"...");
        }
        else{
          newElem.find(".description").text(event.description.text);
        }

        newElem.find('.start-time').text("Start At: " + ToLocalDate(event.start.utc));
        newElem.find('.close-time').text("End At: " + ToLocalDate(event.end.utc));       
        newElem.find('.url').text(event.url);
        events.append(newElem);

    };

    /**
     * Get recent events from API and display all of them
     * @param  {Object}  data       events JSON
     * @return {None}
     */
    var displayEvents = function(data) {
      displaySearching(false);
      if (!data.events.length){
        ErrorMsg.text("No events are relavent to the search or our search reach the limit today.");
      }
      for (var i = 0, length = data.events.length; i < length; i++){
        insertEvent(data.events[i]);
      }
      attachLinkEventHandler();
    };

    /**
     * formate time
     * @param  {datetime}  inDate 
     * @return {None}
     */
    var ToLocalDate = function (inDate) {
      var date = new Date(inDate);
      var options = {weekday: "long", year: "numeric", month: "long", day: "numeric"};
      return date.toLocaleTimeString('en-US', options)
    };

    /**
     * displaying searching message while getting json
     * @param  {boolean}  switching 
     * @return {None}
     */
    var displaySearching = function(switching) {
      if (switching){
        standbyMsg.show();
      } else{
        standbyMsg.hide();
      }
    };

    /**
    * attach the link to each events
    */
    var attachLinkEventHandler = function() {
      $('.event').click(function(element) {
        chrome.tabs.create({ url: element.target.parentNode.href});
      });
    };



    /**
     * convert current date to next weekend friday
     * @return {string} ISOString
     */
    function getNextWeekend() {
      var dayOfWeek = 5; // friday of the week
      var date = new Date();   
      date.setHours(0,0,0,0); // full day of next weekend friday
      date.setDate(date.getDate() + 7 + dayOfWeek - date.getDay());     
      //sometimes, the toISOString give a decimal on second point      
      return date.toISOString().substring(0,19)+"Z";
    };

    /**
     * Add event handlers for submitting the search form.
     * @return {None}
     */
    var attachSearchHandler = function() {
        search.on('click', '.search-button', function() {
            
            var mysearch = {}; 
            var error = "";
            ErrorMsg.empty();

            mysearch.city = search.find('.city-input').val();
            if (mysearch.city.length == 0) {
                error = error.concat("City must be non-empty.");
            } else if (mysearch.city.length > 64) {
                error = error.concat("City must be at most 64 characters.")
            }

            mysearch.state = search.find(".state-input").val().toUpperCase();
            if (mysearch.state.length == 0) {
                error = error.concat("State must be non-empty.");
            } else if (mysearch.state.length > 2) {
                error = error.concat("State must be at most 2 characters.");
            }

            mysearch.week = search.find("#myCheck").is(":checked");            

            if (mysearch.city == previoussearch.city && previoussearch.state == mysearch.state && mysearch.week == previoussearch.week){
              return;
            }

            // delete options['start_date.range_start'];
            // delete options['start_date.keyword'];

            if (error.length == 0) {
              options["venue.city"]= mysearch.city;
              options["venue.region"]= mysearch.state;

              if (mysearch.week){
                options['start_date.range_start'] = getNextWeekend();                
              }
              else{
                var date = new Date();
                options['start_date.range_start'] = date.toISOString().substring(0,19)+"Z";
              }

              events.html('');
              displaySearching(true);
              $.get(apiUrl, options, displayEvents); 
              previoussearch =  mysearch;
            } 
            else {
                ErrorMsg.text(error);
            }
        });
    };

    /**
     * Start the app by attaching event handlers and handle search.
     * @return {None}
     */
    var start = function() {
        events = $(".events");
        search = $(".search");
        standbyMsg = $("#standby-msg");
        ErrorMsg = $("#search-error");
        // Grab the first event, to use as a template
        // Delete everything from .events
        eventTemplateHtml = $(".events .event")[0].outerHTML;              
        events.html('');
        attachSearchHandler();
        console.log(getNextWeekend());  
    };

    // PUBLIC METHODS
    // any private methods returned in the hash are accessible via Event.key_name, e.g. Event.start()
    return {
        start: start
    };
})();
$(document).ready(function() {
  Event.start();
 });