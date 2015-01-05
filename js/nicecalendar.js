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
			width   : "6in",
			height  : "4in",
			padding : "0.25in"
		},
		headerframe : {
			height  : "0.5in",
		},
		weekframe : {
			height       : "0.25in",
			marginBottom : "0.125in",
			fontFamily   : "Georgia",
			fontSize     : "12pt"
		},
		weekdayframe : {
			padding         : "2pt",
			backgroundColor : "dimgray",
			color           : "white",
			fontFamily      : "Georgia",
			fontSize        : "10pt"
		},
		innerframe : {
			height  : "2in",
		},
		headermonth : {
			fontFamily : "Georgia",
			fontWeight : "bold",
			fontStyle  : "normal",
			fontSize   : "20pt",
			color      : "dimgray"
		},
		headeryear : {
			right      : "0",
			fontFamily : "Georgia",
			fontWeight : "normal",
			fontStyle  : "italic",
			fontSize   : "24pt",
			color      : "crimson"
		},
		innerdayframe : {
			borderStyle       : "solid",
			borderTopWidth    : "3pt",
			borderRightWidth  : "0",
			borderBottomWidth : "0",
			borderLeftWidth   : "1pt",
			borderColor       : "darkgray"
		},
		date : {
			fontFamily : "Georgia",
			fontWeight : "normal",
			fontStyle  : "normal",
			fontSize   : "12pt",
			color      : "dimgray"
		},
	};

	var cssCustomSettings = {};

	// Init

	function init () {
		initCustomStyleRules();
		initUI();
		initCalendar();
		applyCustomStyles(cssDefaultSettings);
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
		UI.$opts = $("#nice-calendar-options");

		// Custom CSS Inputs
		cssStyleInterface["pageframe"].inputs = new CustomStyleForm("pageframe", "Page", [
			{cssProp : "width",   label : "Page Width",   method : "length"},
			{cssProp : "height",  label : "Page Height",  method : "length"},
			{cssProp : "padding", label : "Page Margins", method : "length"}
		]);
		cssStyleInterface["innerdayframe"].inputs = new CustomStyleForm("innerdayframe", "Cell", [
			{cssProp : "borderTopWidth",    label : "Border Top",    method : "length"},
			{cssProp : "borderLeftWidth",   label : "Border Left",   method : "length"},
			{cssProp : "borderRightWidth",  label : "Border Right",  method : "length"},
			{cssProp : "borderBottomWidth", label : "Border Bottom", method : "length"},
			{cssProp : "borderStyle",       label : "Border Style",  method : "borderStyle"},
			{cssProp : "borderColor",       label : "Border Color",  method : "color"}
		]);
		cssStyleInterface["headermonth"].inputs = new CustomStyleForm("headermonth", "Month Head", [
			{cssProp : "fontFamily", label : "Font",       method : "length"},
			{cssProp : "fontWeight", label : "Bold",       method : "fontWeight"},
			{cssProp : "fontStyle",  label : "Italic",     method : "fontStyle"},
			{cssProp : "fontSize",   label : "Font Size",  method : "length"},
			{cssProp : "color",      label : "Font Color", method : "color"}
		]);
		cssStyleInterface["headeryear"].inputs = new CustomStyleForm("headeryear", "Year", [
			{cssProp : "fontFamily", label : "Font",       method : "length"},
			{cssProp : "fontWeight", label : "Bold",       method : "fontWeight"},
			{cssProp : "fontStyle",  label : "Italic",     method : "fontStyle"},
			{cssProp : "fontSize",   label : "Font Size",  method : "length"},
			{cssProp : "color",      label : "Font Color", method : "color"}
		]);
		cssStyleInterface["date"].inputs = new CustomStyleForm("date", "Day", [
			{cssProp : "fontFamily", label : "Font",       method : "length"},
			{cssProp : "fontWeight", label : "Bold",       method : "fontWeight"},
			{cssProp : "fontStyle",  label : "Italic",     method : "fontStyle"},
			{cssProp : "fontSize",   label : "Font Size",  method : "length"},
			{cssProp : "color",      label : "Font Color", method : "color"}
		]);

		// NOTE: spectrum.js only works on element already appended to the DOM
		$("input[type='color']").each(function (i, input) {
			var $input = $(input);
			$input.spectrum({
				change : function () {$input.val($input.spectrum("get").toHexString());}
			});
		});
	}

	function initCalendar () {
		UI.$year.attr("value", settings.year = (new window.Date()).getYear() + 1900);
		setCalendar();
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
						.append(createWeekFrame())
						.append(
							$("<div />")
								.addClass(CSS_CLASS_NAMES.innerframe)
								.addClass(CSS_CLASS_NAMES.custom)
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

	function applyCustomStyles (cssSettings) {
		for (var r in cssSettings)
		if (cssSettings.hasOwnProperty(r)) {
			for (var p in cssSettings[r])
			if (cssSettings[r].hasOwnProperty(p)) {
				setProp(r, p, cssSettings[r][p]);
			}
		}
	}

	function CustomStyleForm (ruleName, title, cssPropOpts) {

		var $inputGroup  = $("<div />")
				.addClass("nice-calendar-opts-group"),
			$input;

		this.ruleName    = ruleName;
		this.$inputs     = {};

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
					.append(this.$inputs[cssPropOpts[i].cssProp] = ($input))
			);
		}

		// Append group div to page
		UI.$opts
			.append(
				$("<div />")
					.addClass("nice-calendar-opts-section")
					.append(
						$("<h2 />")
						.addClass("nice-calendar-opts-title")
						.text(title)
					)
					.append($inputGroup)
			);
	}

	function setProp (ruleName, cssProp, cssVal) {
		var $input;
		if (cssStyleInterface[ruleName].inputs) {
			$input = cssStyleInterface[ruleName].inputs.$inputs[cssProp];
		}
		cssVal = cssVal.toLowerCase();
		if ($input) {
			$input.val(cssVal);
			if (cssProp === "fontWeight") {
				$input.attr("checked", !!(cssVal === "bold"));
			}
			else if (cssProp === "fontStyle")  {
				$input.attr("checked", !!(cssVal === "italic"));
			}
		}
		if (!cssCustomSettings[ruleName]) cssCustomSettings[ruleName] = {};
		cssCustomSettings[ruleName][cssProp] = cssStyleInterface[ruleName].cssRule.style[cssProp] = cssVal;
	};

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
