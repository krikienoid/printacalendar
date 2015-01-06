/**
 * Nice Calendar
 *
 * A minimal calendar builder.
 *
 *
 * Contributors:
 *
 * reddit.com/u/krikienoid
 *
 * MIT License 2014
 */

;(function (window, document, $, font, undefined) {

	"use strict";

	// Constants

	var MONTHS = [
		{ name : "January",   days : 31 },
		{ name : "February",  days : 28 },
		{ name : "March",     days : 31 },
		{ name : "April",     days : 30 },
		{ name : "May",       days : 31 },
		{ name : "June",      days : 30 },
		{ name : "July",      days : 31 },
		{ name : "August",    days : 31 },
		{ name : "September", days : 30 },
		{ name : "October",   days : 31 },
		{ name : "November",  days : 30 },
		{ name : "December",  days : 31 }
	];

	var WEEKDAYS = [
		{ name : "Saturday",  abbr : "Sat"  },
		{ name : "Sunday",    abbr : "Sun"  },
		{ name : "Monday",    abbr : "Mon"  },
		{ name : "Tuesday",   abbr : "Tue"  },
		{ name : "Wednesday", abbr : "Wed"  },
		{ name : "Thursday",  abbr : "Thur" },
		{ name : "Friday",    abbr : "Fri"  }
	];

	// Common

	var CSS_CLASS_NAMES = {
		pageframe     : "nice-calendar-pageframe",
		outerframe    : "nice-calendar-outerframe",
		innerframe    : "nice-calendar-innerframe",
		headerframe   : "nice-calendar-headerframe",
		headermonth   : "nice-calendar-headermonth",
		headeryear    : "nice-calendar-headeryear",
		weekframe     : "nice-calendar-weekframe",
		weekdayframe  : "nice-calendar-weekdayframe",
		innerweekdayframe : "nice-calendar-innerweekdayframe",
		weekday       : "nice-calendar-weekday",
		gridframe     : "nice-calendar-gridframe",
		dayframe      : "nice-calendar-dayframe",
		innerdayframe : "nice-calendar-innerdayframe",
		date          : "nice-calendar-date",
		custom        : "custom"
	};

	// CSS Rules that are customizable
	var cssStyleInterface = {};

	var UI = {};

	// Settings

	var settings = {
		year : null
	};

	var cssDefaultSettings = {
		pageframe : {
			width   : "8in",
			height  : "5in",
			padding : "0.375in"
		},
		headerframe : {
			height  : "10%",
		},
		innerframe : {
			width   : "100%",
			height  : "90%"
		},
		weekframe : {
			height       : "0.25in",
			marginBottom : "0.125in"
		},
		gridframe : {
			width        : "100%",
			height       : "3.25in"
		},
		headermonth : {
			top        : "0in",
			left       : "0in",
			fontFamily : "Georgia",
			fontWeight : "bold",
			fontStyle  : "normal",
			fontSize   : "20pt",
			color      : "black"
		},
		headeryear : {
			top        : "0in",
			right      : "0in",
			fontFamily : "Georgia",
			fontWeight : "normal",
			fontStyle  : "italic",
			fontSize   : "24pt",
			color      : "dimgray"
		},
		weekdayframe : {
			padding         : "4pt",
			backgroundColor : "black",
			color           : "white",
			fontFamily      : "Georgia",
			fontWeight      : "normal",
			fontStyle       : "normal",
			fontSize        : "10pt"
		},
		dayframe      : {
			padding : "1.5pt"
		},
		innerdayframe : {
			backgroundColor   : "gainsboro",
			borderStyle       : "solid",
			borderTopWidth    : "6pt",
			borderRightWidth  : "0pt",
			borderBottomWidth : "0pt",
			borderLeftWidth   : "0pt",
			borderColor       : "dimgray"
		},
		date : {
			top        : "0in",
			left       : "2pt",
			fontFamily : "Georgia",
			fontWeight : "normal",
			fontStyle  : "normal",
			fontSize   : "12pt",
			color      : "dimgray"
		},
	};

	var cssCustomSettings = {};

	// Initialize

	function init () {
		initCustomStyleRules();
		initUI();
		initCalendar();
		applyStyles(cssDefaultSettings);
	}

	function initCustomStyleRules () {
		var customStyleElem, customStyleSheet;

		// initialize style element
		customStyleElem      = document.createElement("style");
		customStyleElem.id   = "nice-calendar-custom-stylesheet";
		customStyleElem.type = "text/css";
		document.head.appendChild(customStyleElem);

		// get CSSStyleSheet
		for (var i = 0, ii = document.styleSheets.length; i < ii; i++) {
			if (document.styleSheets[i].ownerNode.id === customStyleElem.id) {
				customStyleSheet = document.styleSheets[i];
				break;
			}
		}

		// initialize CSS rules
		for (var i in CSS_CLASS_NAMES) {
			if (CSS_CLASS_NAMES.hasOwnProperty(i)) {
				customStyleSheet.insertRule(
					"." + CSS_CLASS_NAMES[i] + "." + CSS_CLASS_NAMES.custom + " {}",
					0
				);
				cssStyleInterface[i] = {cssRule : customStyleSheet.cssRules[0]};
			}
		}
	}

	function initUI () {

		// HTML Elements
		UI.$view = $("#nice-calendar-view");
		UI.$year = $("#nice-calendar-year");
		UI.$year.bind("change", function () {
			settings.year = UI.$year.val();
			setCalendar();
		});
		$("#nice-calendar-print").bind("click", window.print.bind(window));
		$("#nice-calendar-show-opts").bind("click", function () {
			$(this).parents(".wrapper-head").toggleClass("open");
		});
		UI.$opts = $("#nice-calendar-options");

		// Custom CSS Input Fields
		cssStyleInterface["pageframe"].$inputs = createInputs("pageframe", "Page", [
			{cssProp : "width",   label : "Page Width",   method : "length"},
			{cssProp : "height",  label : "Page Height",  method : "length"},
			{cssProp : "padding", label : "Page Margins", method : "length"}
		]);
		cssStyleInterface["gridframe"].$inputs = createInputs("gridframe", "Grid", [
			{cssProp : "width",           label : "Grid Width",       method : "length"},
			{cssProp : "height",          label : "Grid Height",      method : "length"},
			{cssProp : "backgroundColor", label : "Background Color", method : "color"}
		]);
		cssStyleInterface["innerdayframe"].$inputs = createInputs("innerdayframe", "Cell", [
			{cssProp : "backgroundColor",   label : "Background Color", method : "color"},
			{cssProp : "borderTopWidth",    label : "Border Top",       method : "length"},
			{cssProp : "borderLeftWidth",   label : "Border Left",      method : "length"},
			{cssProp : "borderRightWidth",  label : "Border Right",     method : "length"},
			{cssProp : "borderBottomWidth", label : "Border Bottom",    method : "length"},
			{cssProp : "borderStyle",       label : "Border Style",     method : "borderStyle"},
			{cssProp : "borderColor",       label : "Border Color",     method : "color"}
		]);
		cssStyleInterface["dayframe"].$inputs = createInputs("dayframe", "Cell Spacing", [
			{cssProp : "padding",         label : "Padding",          method : "length"}
		]);
		cssStyleInterface["date"].$inputs = createInputs("date", "Cell Number", [
			{cssProp : "left",            label : "Position X",       method : "length"},
			{cssProp : "top",             label : "Position Y",       method : "length"},
			{cssProp : "backgroundColor", label : "Background Color", method : "color"},
			{cssProp : "color",           label : "Font Color",       method : "color"},
			{cssProp : "fontFamily",      label : "Font",             method : "length"},
			{cssProp : "fontWeight",      label : "Bold",             method : "fontWeight"},
			{cssProp : "fontStyle",       label : "Italic",           method : "fontStyle"},
			{cssProp : "fontSize",        label : "Font Size",        method : "length"}
		]);
		cssStyleInterface["headermonth"].$inputs = createInputs("headermonth", "Header Month", [
			{cssProp : "left",       label : "Position X", method : "length"},
			{cssProp : "top",        label : "Position Y", method : "length"},
			{cssProp : "color",      label : "Font Color", method : "color"},
			{cssProp : "fontFamily", label : "Font",       method : "length"},
			{cssProp : "fontWeight", label : "Bold",       method : "fontWeight"},
			{cssProp : "fontStyle",  label : "Italic",     method : "fontStyle"},
			{cssProp : "fontSize",   label : "Font Size",  method : "length"}
		]);
		cssStyleInterface["headeryear"].$inputs = createInputs("headeryear", "Header Year", [
			{cssProp : "left",       label : "Position X", method : "length"},
			{cssProp : "top",        label : "Position Y", method : "length"},
			{cssProp : "color",      label : "Font Color", method : "color"},
			{cssProp : "fontFamily", label : "Font",       method : "length"},
			{cssProp : "fontWeight", label : "Bold",       method : "fontWeight"},
			{cssProp : "fontStyle",  label : "Italic",     method : "fontStyle"},
			{cssProp : "fontSize",   label : "Font Size",  method : "length"}
		]);
		cssStyleInterface["weekdayframe"].$inputs = createInputs("weekdayframe", "Week Days", [
			{cssProp : "padding",         label : "Padding",          method : "length"},
			{cssProp : "backgroundColor", label : "Background Color", method : "color"},
			{cssProp : "color",           label : "Font Color",       method : "color"},
			{cssProp : "fontFamily",      label : "Font",             method : "length"},
			{cssProp : "fontWeight",      label : "Bold",             method : "fontWeight"},
			{cssProp : "fontStyle",       label : "Italic",           method : "fontStyle"},
			{cssProp : "fontSize",        label : "Font Size",        method : "length"}
		]);

		// NOTE: spectrum.js only works on element already appended to the DOM
		// Delay spectrum init until after all inputs have been appended to the DOM
		$("input[type='color']").each(function (i, input) {
			var $input = $(input);
			$input.spectrum({
				change : function () {$input.val($input.spectrum("get").toHexString());},
				allowEmpty : true,
				showInput  : true
			});
		});
	}

	function initCalendar () {
		UI.$year.attr("value", settings.year = (new window.Date()).getYear() + 1900);
		setCalendar();
	}

	// Create Input Fields

	function createInput (valType) {
		var $input;
		switch (valType) {
			case "borderStyle" :
				$input = $("<select />")
					.append($("<option />").text("none").attr("selected", "selected"))
					.append($("<option />").text("solid"))
					.append($("<option />").text("double"))
					.append($("<option />").text("dashed"))
					.append($("<option />").text("dotted"))
					.append($("<option />").text("groove"))
					.append($("<option />").text("inset"))
					.append($("<option />").text("outset"));
				break;
			case "color" :
				$input = $("<input />")
					.addClass("nice-calendar-input")
					.addClass("opts")
					.attr("type", "color");
				break;
			case "fontWeight" :
			case "fontStyle" :
				$input = $("<input />")
					.addClass("nice-calendar-input")
					.addClass("opts")
					.attr("type", "checkbox");
				break;
			case "length" :
				$input = $("<input />")
					.addClass("nice-calendar-input")
					.addClass("opts")
					.attr("type", "text");
				break;
			default : 
				$input = $("<input />")
					.addClass("nice-calendar-input")
					.addClass("opts")
					.attr("type", "text");
				break;
		}
		return $input;
	}

	function createInputs (ruleName, title, cssPropOpts) {

		var $inputGroup  = $("<div />")
				.addClass("nice-calendar-opts-group"),
			$inputs      = {},
			$input;

		cssCustomSettings[ruleName] = {};

		// Create input elements
		for (var i = 0, ii = cssPropOpts.length; i < ii; i++) {

			// Create input element
			$input = createInput(cssPropOpts[i].method);

			// Bind event to input
			$input.bind(
				"change",
				(function (_this, cssProp) {
					if (cssProp === "fontWeight") {
						return function () {setProp(ruleName, cssProp, (this.checked)? "bold" : "normal");};
					}
					else if (cssProp === "fontStyle") {
						return function () {setProp(ruleName, cssProp, (this.checked)? "italic" : "normal");};
					}
					else {
						return function () {setProp(ruleName, cssProp, this.value);};
					}
				})(this, cssPropOpts[i].cssProp)
			)

			// Append input and label to group div
			$inputGroup.append(
				$("<p />")
					.text(cssPropOpts[i].label + ": ")
					.append($inputs[cssPropOpts[i].cssProp] = $input)
			);
		}

		// Append group div to page
		UI.$opts
			.append(
				$("<div />")
					.addClass("nice-calendar-opts-section")
					.append(
						$("<h2 />")
						.addClass("nice-calendar-opts-header")
						.append(
							$("<a />")
							.text(title)
							.bind("click", function () {
								var $optsSectionFocus = $(this).parents(".nice-calendar-opts-section"),
									hadFocus = $optsSectionFocus.hasClass("focus");
								$(".nice-calendar-opts-section").removeClass("focus");
								if (!hadFocus) {
									$optsSectionFocus.addClass("focus");
								}
							})
						)
					)
					.append($inputGroup)
			);

		return $inputs;

	}

	// Generate Calendar

	function setCalendar () {
		UI.$view.empty();
		for (var i = 0; i < MONTHS.length; i++) {
			UI.$view.append(createMonthPage(settings.year, i));
		}
	}

	function createMonthPage (year, monthIndex) {
		var monthOffset   = getMonthlyOffset(year, monthIndex),
			days          = getDaysInAMonth(year, monthIndex),
			$newGridFrame = $("<div />")
				.addClass(CSS_CLASS_NAMES.gridframe)
				.addClass(CSS_CLASS_NAMES.custom);

		for (var i = 0; i < monthOffset; i++) {
			$newGridFrame.append(createBlankBlock());
		}
		for (var i = 0; i < days; i++) {
			$newGridFrame.append(createDayBlock(i));
		}
		for (var i = monthOffset + days; i < 35; i++) {
			$newGridFrame.append(createBlankBlock());
		}

		return (
			$("<div />")
				.addClass(CSS_CLASS_NAMES.pageframe)
				.addClass(CSS_CLASS_NAMES.custom)
				.append(
					$("<div />")
						.addClass(CSS_CLASS_NAMES.outerframe)
						.addClass(CSS_CLASS_NAMES.custom)
						.append(
							$("<div />")
								.addClass(CSS_CLASS_NAMES.headerframe)
								.addClass(CSS_CLASS_NAMES.custom)
								.append(
									$("<span />")
										.addClass(CSS_CLASS_NAMES.headermonth)
										.addClass(CSS_CLASS_NAMES.custom)
										.text(MONTHS[monthIndex].name)
								)
								.append(
									$("<span />")
										.addClass(CSS_CLASS_NAMES.headeryear)
										.addClass(CSS_CLASS_NAMES.custom)
										.text(settings.year)
								)
						)
						.append(
							$("<div />")
								.addClass(CSS_CLASS_NAMES.innerframe)
								.addClass(CSS_CLASS_NAMES.custom)
								.append(createWeekFrame())
								.append($newGridFrame)
						)
				)
		);
	}

	function createWeekFrame () {
		var $newWeekFrame = $("<div />")
				.addClass(CSS_CLASS_NAMES.weekframe)
				.addClass(CSS_CLASS_NAMES.custom);
		for (var i = 0, ii = WEEKDAYS.length; i < ii; i++) {
			$newWeekFrame.append(
				$("<div />")
					.addClass(CSS_CLASS_NAMES.weekdayframe)
					.addClass(CSS_CLASS_NAMES.custom)
					.text(WEEKDAYS[(i + 8) % 7].name)
			);
		}
		return $newWeekFrame;
	}

	function createDayBlock (dayIndex) {
		return (
			$("<div />")
				.addClass(CSS_CLASS_NAMES.dayframe)
				.addClass(CSS_CLASS_NAMES.custom)
				.append(
					$("<div />")
						.addClass(CSS_CLASS_NAMES.innerdayframe)
						.addClass(CSS_CLASS_NAMES.custom)
						.append(
							$("<div />")
								.addClass(CSS_CLASS_NAMES.date)
								.addClass(CSS_CLASS_NAMES.custom)
								.text(dayIndex + 1)
						)
				)
		);
	}

	function createBlankBlock () {
		return $("<div />").addClass(CSS_CLASS_NAMES.dayframe).addClass("blank");
	}

	// Set Styles

	function setProp (ruleName, cssProp, cssVal) {
		var $input;
		cssVal = cssVal.toLowerCase();

		// Update corresponding input elements
		if (cssStyleInterface[ruleName].$inputs) {
			$input = cssStyleInterface[ruleName].$inputs[cssProp];
		}
		if ($input) {
			$input.val(cssVal);
			if (cssProp === "fontWeight") {
				$input.attr("checked", !!(cssVal === "bold"));
			}
			else if (cssProp === "fontStyle")  {
				$input.attr("checked", !!(cssVal === "italic"));
			}
			else if ($input.attr("type") === "color") {
				$input.spectrum("set", cssVal);
			}
		}

		// Set and store CSS property value
		if (!cssCustomSettings[ruleName]) {
			cssCustomSettings[ruleName] = {};
		}
		cssCustomSettings[ruleName][cssProp] = cssStyleInterface[ruleName].cssRule.style[cssProp] = cssVal;

		// return value
		return cssStyleInterface[ruleName].cssRule.cssText;
	};

	function applyStyles (cssSettings) {
		for (var r in cssSettings)
		if (cssSettings.hasOwnProperty(r)) {
			for (var p in cssSettings[r])
			if (cssSettings[r].hasOwnProperty(p)) {
				setProp(r, p, cssSettings[r][p]);
			}
		}
	}

	// Utilities

	// Unit Conversion Utilities

	function splitUnit (unit) {
		return [
			window.parseFloat(unit),
			unit.split(/[^A-Za-z]/).join("").toLowerCase()
		];
	}

	function isValidUnit (unitType) {
		switch (unitType.toLowerCase()) {
			case ""   :
			case "%"  :
			case "px" :
			case "pt" :
			case "pc" :
			case "in" :
			case "cm" :
			case "mm" :
			case "em" :
				return true;
			default :
				return false;
		}
	}

	function convertStaticUnitToPx (unit) {
		var split    = splitUnit(unit),
			unitNum  = split[0],
			unitType = split[1];
		switch (unitType) {
			case ""   :
			case "px" : break;
			case "pt" : unitNum *= 4 / 3; break;
			case "pc" : unitNum *= 16; break;
			case "in" : unitNum *= 96; break;
			case "cm" : unitNum *= 96 / 2.54; break;
			case "mm" : unitNum *= 96 / 25.4; break;
		}
		return unitNum.toFixed(4) + "px";
	}

	function convertStaticUnitFromPx (unit, unitType) {
		var unitNum = splitUnit(unit)[0];
		switch (unitType) {
			case ""   :
			case "px" : break;
			case "pt" : unitNum *= 3 / 4;  break;
			case "pc" : unitNum *= 1 / 16; break;
			case "in" : unitNum *= 1 / 96; break;
			case "cm" : unitNum *= 2.54 / 96; break;
			case "mm" : unitNum *= 25.4 / 96; break;
		}
		return unitNum.toFixed(4) + unitType;
	}

	function convertStaticUnit (unit, unitType) {
		return convertStaticUnitFromPx(convertStaticUnitToPx(unit), unitType);
	}

	function convertUnit (a, b) {
	
	}

	function setUnit (node, key, value) {
		
	}

	// Calendar Utilities

	function isLeapYear (year) {
		     if (year % 4   !== 0) return false;
		else if (year % 100 !== 0) return true;
		else if (year % 400 !== 0) return false;
		else                       return true;
	}

	function getDaysInAMonth (year, monthIndex) {
		if (monthIndex === 1 && isLeapYear(year)) {
			return MONTHS[monthIndex].days + 1;
		}
		else {
			return MONTHS[monthIndex].days;
		}
	}

	function getYearlyOffset (year) {
		year -= 1;
		return (
			(
				27 +
				window.Math.floor(42 / 5) +
				year +
				window.Math.floor(year /   4) -
				window.Math.floor(year / 100) +
				window.Math.floor(year / 400) +
				2
			) %
			7
		);
	}

	function getMonthlyOffset (year, monthIndex) {
		var totalDays = getYearlyOffset(year) - 1;
		for (var i = 0; i < monthIndex; i++) {
			totalDays += MONTHS[i].days;
		}
		return totalDays % 7;
	}

	// Export

	window.niceCalendar =  {
		init    : init,
		setProp : setProp
	};

})(window, document, jQuery, font);
