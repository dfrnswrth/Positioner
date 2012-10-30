/*
 *	Plugin: Positioner
 */
/*jshint jquery:true smarttabs:true*/
/*global define*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {
	"use strict";

	/*
	 *	Utility Functions
	 */
	var Utils = {
		// getRandomFromArray: function(arr){
		// 	return arr[ Math.floor(Math.random()*arr.length) ];
		// },
		getRandomNumber: function(max){
			return Math.floor(Math.random()*max);
		},
		//	Resize with Aspect Ratio
		//	origHeight and origWidth are required
		//	either newHeight or newWidth are required
		//	returns height and width
		resizeWithAspectRatio: function(origHeight, origWidth, newHeight, newWidth){
			if (!origHeight || !origWidth) return false;
			var ar = origHeight / origWidth;
			if (newWidth) {
				newHeight = Math.ceil(newWidth * ar);
			} else {
				newWidth = Math.ceil(newHeight / ar);
			}
			return {
				height: newHeight,
				width: newWidth
			};
		},

		/**
		 *	checkForCollisions()
		 *	coordinates: nw, ne, se, sw
		 *	returns true for collisions
		 */
		checkForCollisions: function(item, excluded){
			// the first object is always ok
			if (!excluded.length) return false;
			var collision = false;
			for (var i = 0; i < excluded.length; i++) {
				var tester = excluded[i]; // area we're testing against
				if (// is item[nw] excluded?
					(	item[0][0] >= tester[0][0] &&
						item[0][0] <= tester[1][0] &&
						item[0][1] >= tester[0][1] &&
						item[0][1] <= tester[3][1]) ||
					// is item[ne] excluded?
					(	item[1][0] >= tester[0][0] &&
						item[1][0] <= tester[1][0] &&
						item[1][1] >= tester[0][1] &&
						item[1][1] <= tester[3][1]) ||
					// is item[se] excluded?
					(	item[2][0] >= tester[0][0] &&
						item[2][0] <= tester[1][0] &&
						item[2][1] >= tester[0][1] &&
						item[2][1] <= tester[3][1]) ||
					// is item[sw] excluded?
					(	item[3][0] >= tester[0][0] &&
						item[3][0] <= tester[1][0] &&
						item[3][1] >= tester[0][1] &&
						item[3][1] <= tester[3][1]) ||
					// is tester[nw] excluded?
					(	tester[0][0] >= item[0][0] &&
						tester[0][0] <= item[1][0] &&
						tester[0][1] >= item[0][1] &&
						tester[0][1] <= item[3][1]) ||
					// is tester[ne] excluded?
					(	tester[1][0] >= item[0][0] &&
						tester[1][0] <= item[1][0] &&
						tester[1][1] >= item[0][1] &&
						tester[1][1] <= item[3][1]) ||
					// is tester[se] excluded?
					(	tester[2][0] >= item[0][0] &&
						tester[2][0] <= item[1][0] &&
						tester[2][1] >= item[0][1] &&
						tester[2][1] <= item[3][1]) ||
					// is tester[sw] excluded?
					(	tester[3][0] >= item[0][0] &&
						tester[3][0] <= item[1][0] &&
						tester[3][1] >= item[0][1] &&
						tester[3][1] <= item[3][1])){
					collision = true;
				}
			}
			return collision;
		}
	};

	/*
	 *	Positioner
	 */
	var Positioner = function(element, options){
		this.$el = element;
		this.$el.css({position: "relative"});
		this.options = $.extend({}, $.fn.positioner.defaults, options);
		this.width = this.$el.width() - this.options.containerPadding[1] - this.options.containerPadding[3];
		this.height = this.$el.height() - this.options.containerPadding[0] - this.options.containerPadding[2];

		this.area = this.width * this.height;
		this.$items = this.$el.find(options.item);
		this.count = this.$items.length;
		this.filledAreas = [];
		this.requiredArea = 0;
		this.iterator = 0;

		this.getData();
		this.positionAll();

		// remove positioning from single item
		this.$items.on("removepositioning", $.proxy(this.removeItemPositioning, this));

		// remove positioning from all items
		this.$el.on("removeallpositioning", $.proxy(this.removeAllPositioning, this));
	};

	Positioner.prototype = {
		getData: function(){
			// Reset All
			this.filledAreas = [];
			this.iterator = 0;

			// get data
			for (var i = 0; i < this.$items.length; i++) {
				var thisItem = this.$items.eq(i);
				this.getDimensions(thisItem);
				this.getOkCoordinates(thisItem);
			}
		},
		getDimensions: function(item){
			var itemWidth = item.outerWidth(),
				itemHeight = item.outerHeight(),
				index = Math.floor(Math.random()*this.options.widths.length),
				desiredWidth = this.options.widths[index],
				classToAdd = this.options.classes[index],
				dimensions = Utils.resizeWithAspectRatio(itemHeight, itemWidth, null, desiredWidth),
				requiredArea = (dimensions.height + this.options.margin) * (dimensions.width  + this.options.margin);

			item.data("Positioner.dimensions", dimensions)
				.addClass(classToAdd);

			// how much area do we need at a minimum?
			this.requiredArea = this.requiredArea + requiredArea;
		},
		getOkCoordinates: function(item){
			this.whileIterator = 0;
			var itemData = item.data("Positioner.dimensions"),
				height = itemData.height,
				width = itemData.width,
				outerHeight = itemData.height + this.options.margin,
				outerWidth = itemData.width + this.options.margin,
				xMax = this.width - width - this.options.margin,
				yMax = this.height - height - this.options.margin,
				left = Utils.getRandomNumber(xMax),
				top = Utils.getRandomNumber(yMax);

			// position coordinates
			var nw = [ left, top ],
				ne = [ left + outerWidth, top ],
				se = [ left + outerWidth, top + outerHeight ],
				sw = [ left, top + outerHeight ],
				coordinates = [nw,ne,se,sw];

			while (Utils.checkForCollisions(coordinates,this.filledAreas)){
				itemData = item.data("Positioner.dimensions"),
				height = itemData.height,
				width = itemData.width,
				left = Utils.getRandomNumber(xMax),
				top = Utils.getRandomNumber(yMax);
				nw = [ left, top ],
				ne = [ left + outerWidth, top ],
				se = [ left + outerWidth, top + outerHeight ],
				sw = [ left, top + outerHeight ],
				coordinates = [nw,ne,se,sw];

				this.whileIterator++;

				if (this.whileIterator > 100) {
					this.increaseElementSize();
				}
				if (this.iterator > 3) {
					this.getData();
					break;
				}
			}
			item.data("Positioner.coordinates", {left: left, top: top});
			this.filledAreas.push(coordinates);
		},
		positionItem: function(item) {
			var itemDimensions = item.data("Positioner.dimensions"),
				itemCoordinates = item.data("Positioner.coordinates");

			item.css({
				position: "absolute",
				height: itemDimensions.height,
				width: itemDimensions.width,
				left: itemCoordinates.left + this.options.containerPadding[3],
				top: itemCoordinates.top + this.options.containerPadding[0]
			});

			item.trigger("positioned");
		},
		positionAll: function(){
			var triggerCount = this.$items.length - 1;
			for (var i = 0; i < this.$items.length; i++) {
				var thisItem = this.$items.eq(i);
				this.positionItem(thisItem);
				if (i === triggerCount) this.$el.trigger("itemsPositioned");
			}
		},
		increaseElementSize: function(){
			var newWidth, newHeight;
			if (this.options.dimensionToExpand === "width") {
				newWidth = this.width + this.options.expandBy;
				this.$el.css({ "width": newWidth });
				this.width = newWidth;
			} else {
				newHeight = this.height + this.options.expandBy;
				this.$el.css({ "height": newHeight });
				this.height = newHeight;
			}
			this.iterator++;
			this.whileIterator = 0;
		},
		removeItemPositioning: function(e){
			$(e.target).css({
				top: '',
				left: '',
				position: "relative"
			});
		},
		removeAllPositioning: function() {
			this.$items.each(function(){
				$(this).css({
					top: '',
					left: '',
					position: "relative"
				});
			});
		}
	};

	$.fn.positioner = function(options){
		this.each(function(){
			var target = $(this);
			new Positioner(target, options);
		});

		return this;
	};

	$.fn.positioner.defaults = {
		classes: [],					// classes for widths
		containerPadding: [0,0,0,0],	// padding (in css order)
		dimensionToExpand: "width",		// base side for dimemsional calculation
		expandBy: 200,					// px incriment to expand parent element
		margin: 0,						// margin for each element
		item: null,						// item selector
		widths: []						// available widths
	};

}));