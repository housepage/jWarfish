/*
 *  Project: 
 *  Description: 
 *  Author: 
 *  License: 
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, undefined ) {
    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.
    
    // window is passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'jWarfish',
        document = window.document,
        defaults = {
            rss_reference_url:'http://warfish.net/war/play/gamelist?rss=1',
            login_url:'http://warfish.net/war/login',
            on_not_logged_in: function() {
                console.log("Not logged in");
            },
            on_error: function() {
                console.log("Error in fetching data");
            },
            on_update_turn_count: function() {
                console.log("Updating");
            },
            polling_interval: 60000,
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    Plugin.prototype = { 
      init : function () {
        this.updateRSSURL();
        this.initializeTurnCountUpdate();
      },

      updateRSSURL : function(el, options) {

        var active_rss_url, your_turn_rss_url,
            this_options = this.options;

        var rss_reference = $.ajax(
            { url: this.options.rss_reference_url, 
              success: function(data,textStatus,request) {
                var parsed = $(data).find('a[type="application/rss+xml"]');

                if(parsed.length > 1){
                  active_rss_url = $(parsed[0]).attr('href');
                  your_turn_rss_url = $(parsed[1]).attr('href');
                } else {
                  this_options.on_not_logged_in();
                }
              },
              error: function(data) {
                console.log("Error in retriving rss url");
                this_options.on_error();
              },
              async: false,
              type: "GET",
        });

        this.rss_url = {
          active : active_rss_url,
          turn : your_turn_rss_url
        };
      },


      getGames: function(url){
        var games;


        if(url != undefined) {
          var feed = jQuery.getFeed({
            url: url,
            success: function(feed) {
              games = feed; 
            }
          });
        } else {
          this.options.on_error(); 
        }

        if(typeof games == 'undefined'){
          this.options.on_error();
          return {items :[]};
        }

        return games; 
      },

      getTurnGames : function(el, options) {
        if(this.rss_url != undefined) {
          return this.getGames(this.rss_url.turn);
        } else {
          console.log("WHOA");
          this.options.on_error();
          return {items :[]};
        }
      },

      getTurnGamesCount : function(el, options) {
        var count = this.getTurnGames().items.length - 1;
        if(count < 0){
          return 'E';
        } else {
          return count;
        }
      },

      getActiveGames : function(el, options) {
        if(this.rss_url != undefined){
          return this.getGames(this.rss_url.active);
        } else {
          this.options.on_error();
          return {items :[]};
        }
      },

      getActiveGamesCount : function(el, options) {
        var count = this.getActiveGames().items.length - 1;
        if(count < 0){
          return 'E';
        } else {
          return count;
        }
      },

      initializeTurnCountUpdate : function(el,options) {
        var warfish = this;

        var warfish_update_count = function() {
          warfish.updateTurnCount();
        };

        window.onload = warfish_update_count;
        window.setInterval(warfish_update_count, warfish.options.polling_interval);
      },

      updateTurnCount : function() {
        var turn_count = this.getTurnGamesCount();
        this.options.on_turn_update(turn_count); 
      },

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.jWarfish = function ( options ) {
        return new Plugin( this, options );
    };
}(jQuery, window));
