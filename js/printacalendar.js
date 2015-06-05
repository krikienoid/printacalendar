/**
 * Print-a-Calendar
 *
 * A basic tool for creating and printing calendars.
 *
 *
 * Author:
 *
 * u/krikienoid
 *
 * MIT License 2014
 */

;(function (window, document, $, ZoomPort, undefined) {

	'use strict';

	//
	// Constants
	//

	var MONTHS = [
		{ name : 'January',   days : 31 },
		{ name : 'February',  days : 28 },
		{ name : 'March',     days : 31 },
		{ name : 'April',     days : 30 },
		{ name : 'May',       days : 31 },
		{ name : 'June',      days : 30 },
		{ name : 'July',      days : 31 },
		{ name : 'August',    days : 31 },
		{ name : 'September', days : 30 },
		{ name : 'October',   days : 31 },
		{ name : 'November',  days : 30 },
		{ name : 'December',  days : 31 }
	];

	var WEEKDAYS = [
		{ name : 'Saturday',  abbr : 'Sat' },
		{ name : 'Sunday',    abbr : 'Sun' },
		{ name : 'Monday',    abbr : 'Mon' },
		{ name : 'Tuesday',   abbr : 'Tue' },
		{ name : 'Wednesday', abbr : 'Wed' },
		{ name : 'Thursday',  abbr : 'Thu' },
		{ name : 'Friday',    abbr : 'Fri' }
	];

	//
	// Common
	//

	var CSS_CLASS_NAMES = {
		pageframe         : 'printacal-calendar-pageframe',
		outerframe        : 'printacal-calendar-outerframe',
		innerframe        : 'printacal-calendar-innerframe',
		headerframe       : 'printacal-calendar-headerframe',
		headermonth       : 'printacal-calendar-headermonth',
		headeryear        : 'printacal-calendar-headeryear',
		weekframe         : 'printacal-calendar-weekframe',
		weekdayframe      : 'printacal-calendar-weekdayframe',
		innerweekdayframe : 'printacal-calendar-innerweekdayframe',
		weekday           : 'printacal-calendar-weekday',
		gridframe         : 'printacal-calendar-gridframe',
		dayframe          : 'printacal-calendar-dayframe',
		innerdayframe     : 'printacal-calendar-innerdayframe',
		date              : 'printacal-calendar-date',
		custom            : 'printacal-calendar-custom'
	};

	var data = {
		year   : null,
		styles : {},
		rules  : {}
	};

	var ui = {},
		styleInputs = {};

	var defaultStyles = {
		pageframe : {
			width   : '11in',
			height  : '8.5in',
			padding : '0.375in'
		},
		headerframe : {
			height  : '10%',
		},
		innerframe : {
			width   : '100%',
			height  : '90%'
		},
		weekframe : {
			height       : '0.25in',
			marginBottom : '0.125in'
		},
		gridframe : {
			width        : '100%',
			height       : '6.125in'
		},
		headermonth : {
			top        : '0in',
			left       : '0in',
			fontFamily : 'Georgia',
			fontWeight : 'bold',
			fontStyle  : 'normal',
			fontSize   : '20pt',
			color      : 'black'
		},
		headeryear : {
			top        : '0in',
			right      : '0in',
			fontFamily : 'Georgia',
			fontWeight : 'normal',
			fontStyle  : 'italic',
			fontSize   : '24pt',
			color      : 'black'
		},
		weekdayframe : {
			padding         : '1.5pt'
		},
		innerweekdayframe : {
			padding         : '2pt',
			backgroundColor : 'black'
		},
		weekday : {
			color           : 'white',
			fontFamily      : 'Georgia',
			fontWeight      : 'normal',
			fontStyle       : 'normal',
			fontSize        : '10pt'
		},
		dayframe      : {
			padding : '1.5pt'
		},
		innerdayframe : {
			backgroundColor   : '#ddd',
			borderStyle       : 'solid',
			borderTopWidth    : '6pt',
			borderRightWidth  : '0pt',
			borderBottomWidth : '0pt',
			borderLeftWidth   : '0pt',
			borderColor       : 'black'
		},
		date : {
			top        : '0in',
			left       : '2pt',
			fontFamily : 'Georgia',
			fontWeight : 'normal',
			fontStyle  : 'normal',
			fontSize   : '12pt',
			color      : 'black'
		},
	};

	//
	// Initialize
	//

	function jumpToMonth (monthIndex) {
		while (monthIndex < 0) {monthIndex += MONTHS.length;} 
		monthIndex %= MONTHS.length;
		ui.$monthPages.removeClass('active');
		ui.$monthPage = ui.$monthPages.eq(monthIndex);
		ui.$monthPage.addClass('active');
	}

	function initCustomStyleRules () {

		var customStyleElem, customStyleSheet;

		// Initialize style element
		customStyleElem      = document.createElement('style');
		customStyleElem.id   = 'printacal-custom-stylesheet';
		customStyleElem.type = 'text/css';
		document.head.appendChild(customStyleElem);

		// Get CSSStyleSheet
		for (var i = 0, ii = document.styleSheets.length; i < ii; i++) {
			if (document.styleSheets[i].ownerNode.id === customStyleElem.id) {
				customStyleSheet = document.styleSheets[i];
				break;
			}
		}

		// Initialize CSS rules
		for (var r in CSS_CLASS_NAMES) {if (CSS_CLASS_NAMES.hasOwnProperty(r)) {
			customStyleSheet.insertRule(
				'.' + CSS_CLASS_NAMES[r] + '.' + CSS_CLASS_NAMES.custom + ' {}',
				0
			);
			data.rules[r] = customStyleSheet.cssRules[0];
		}}

	}

	function createInput (inputOpt) {
		var $input;
		switch (inputOpt.valType) {
			case 'borderStyle' :
				$input = $('<select/>')
					.addClass('printacal-input')
					.addClass('opts')
					.append($('<option/>').text('none').attr('selected', 'selected'))
					.append($('<option/>').text('solid'))
					.append($('<option/>').text('double'))
					.append($('<option/>').text('dashed'))
					.append($('<option/>').text('dotted'))
					.append($('<option/>').text('groove'))
					.append($('<option/>').text('inset'))
					.append($('<option/>').text('outset'));
				break;
			case 'color' :
				$input = $('<input/>')
					.addClass('printacal-input')
					.addClass('opts')
					.attr('type', 'color');
				break;
			case 'fontWeight' :
			case 'fontStyle' :
				$input = $('<input/>')
					.addClass('printacal-input')
					.addClass('opts')
					.attr('type', 'checkbox');
				break;
			case 'length' :
				$input = $('<input/>')
					.addClass('printacal-input')
					.addClass('opts')
					.attr('type', 'text');
				break;
			default : 
				$input = $('<input/>')
					.addClass('printacal-input')
					.addClass('opts')
					.attr('type', 'text');
				break;
		}
		switch (inputOpt.cssProp) {
			case 'fontWeight' :
				$input.on('change', function () {
					setStyleProp(inputOpt.ruleName, inputOpt.cssProp, (this.checked)? 'bold' : 'normal');
				});
				break;
			case 'fontStyle' :
				$input.on('change', function () {
					setStyleProp(inputOpt.ruleName, inputOpt.cssProp, (this.checked)? 'italic' : 'normal');
				});
				break;
			default :
				$input.on('change', function () {
					setStyleProp(inputOpt.ruleName, inputOpt.cssProp, this.value);
				});
				break;
		}
		if (!styleInputs[inputOpt.ruleName]) {
			styleInputs[inputOpt.ruleName] = {};
		}
		styleInputs[inputOpt.ruleName][inputOpt.cssProp] = $input;
		return $input;
	}

	function createInputGroup (title, inputOpts) {

		var $inputGroup  = $('<div/>')
				.addClass('printacal-opts-group');

		for (var i = 0, ii = inputOpts.length; i < ii; i++) {
			$inputGroup.append(
				$('<p/>')
					.text(inputOpts[i].label + ': ')
					.append(createInput(inputOpts[i]))
			);
		}

		ui.$opts
			.append(
				$('<div/>')
					.addClass('printacal-opts-section')
					.append(
						$('<h2/>')
						.addClass('printacal-opts-header')
						.append(
							$('<a/>')
							.text(title)
							.on('click', function () {
								var $optsSectionFocus = $(this)
										.parents('.printacal-opts-section'),
									hadFocus = $optsSectionFocus
										.hasClass('focus');
								$('.printacal-opts-section')
									.removeClass('focus');
								if (!hadFocus) {
									$optsSectionFocus.addClass('focus');
								}
							})
						)
					)
					.append($inputGroup)
			);

	}

	function initInputFields () {

		createInputGroup('Page Size', [
			{ruleName : 'pageframe', cssProp : 'width',   label : 'Page Width',   valType : 'length'},
			{ruleName : 'pageframe', cssProp : 'height',  label : 'Page Height',  valType : 'length'},
			{ruleName : 'pageframe', cssProp : 'padding', label : 'Page Margins', valType : 'length'}
		]);
		createInputGroup('Grid', [
			{ruleName : 'gridframe', cssProp : 'width',           label : 'Grid Width',       valType : 'length'},
			{ruleName : 'gridframe', cssProp : 'height',          label : 'Grid Height',      valType : 'length'},
			{ruleName : 'gridframe', cssProp : 'backgroundColor', label : 'Background Color', valType : 'color' },
			{ruleName : 'dayframe',  cssProp : 'padding',         label : 'Gutter',           valType : 'length'}
		]);
		createInputGroup('Cell', [
			{ruleName : 'innerdayframe', cssProp : 'backgroundColor',   label : 'Background Color', valType : 'color'},
			{ruleName : 'innerdayframe', cssProp : 'borderTopWidth',    label : 'Border Top',       valType : 'length'},
			{ruleName : 'innerdayframe', cssProp : 'borderLeftWidth',   label : 'Border Left',      valType : 'length'},
			{ruleName : 'innerdayframe', cssProp : 'borderRightWidth',  label : 'Border Right',     valType : 'length'},
			{ruleName : 'innerdayframe', cssProp : 'borderBottomWidth', label : 'Border Bottom',    valType : 'length'},
			{ruleName : 'innerdayframe', cssProp : 'borderStyle',       label : 'Border Style',     valType : 'borderStyle'},
			{ruleName : 'innerdayframe', cssProp : 'borderColor',       label : 'Border Color',     valType : 'color'}
		]);
		createInputGroup('Cell Date', [
			{ruleName : 'date', cssProp : 'left',            label : 'Position X',       valType : 'length'},
			{ruleName : 'date', cssProp : 'top',             label : 'Position Y',       valType : 'length'},
			{ruleName : 'date', cssProp : 'backgroundColor', label : 'Background Color', valType : 'color'},
			{ruleName : 'date', cssProp : 'color',           label : 'Font Color',       valType : 'color'},
			{ruleName : 'date', cssProp : 'fontFamily',      label : 'Font',             valType : 'length'},
			{ruleName : 'date', cssProp : 'fontWeight',      label : 'Bold',             valType : 'fontWeight'},
			{ruleName : 'date', cssProp : 'fontStyle',       label : 'Italic',           valType : 'fontStyle'},
			{ruleName : 'date', cssProp : 'fontSize',        label : 'Font Size',        valType : 'length'}
		]);
		createInputGroup('Header Month', [
			{ruleName : 'headermonth', cssProp : 'left',       label : 'Position X', valType : 'length'},
			{ruleName : 'headermonth', cssProp : 'top',        label : 'Position Y', valType : 'length'},
			{ruleName : 'headermonth', cssProp : 'color',      label : 'Font Color', valType : 'color'},
			{ruleName : 'headermonth', cssProp : 'fontFamily', label : 'Font',       valType : 'length'},
			{ruleName : 'headermonth', cssProp : 'fontWeight', label : 'Bold',       valType : 'fontWeight'},
			{ruleName : 'headermonth', cssProp : 'fontStyle',  label : 'Italic',     valType : 'fontStyle'},
			{ruleName : 'headermonth', cssProp : 'fontSize',   label : 'Font Size',  valType : 'length'}
		]);
		createInputGroup('Header Year', [
			{ruleName : 'headeryear', cssProp : 'left',       label : 'Position X', valType : 'length'},
			{ruleName : 'headeryear', cssProp : 'top',        label : 'Position Y', valType : 'length'},
			{ruleName : 'headeryear', cssProp : 'color',      label : 'Font Color', valType : 'color'},
			{ruleName : 'headeryear', cssProp : 'fontFamily', label : 'Font',       valType : 'length'},
			{ruleName : 'headeryear', cssProp : 'fontWeight', label : 'Bold',       valType : 'fontWeight'},
			{ruleName : 'headeryear', cssProp : 'fontStyle',  label : 'Italic',     valType : 'fontStyle'},
			{ruleName : 'headeryear', cssProp : 'fontSize',   label : 'Font Size',  valType : 'length'}
		]);
		createInputGroup('Week Day Frame', [
			{ruleName : 'weekdayframe',      cssProp : 'padding',         label : 'Gutter',           valType : 'length'},
			{ruleName : 'innerweekdayframe', cssProp : 'padding',         label : 'Padding',          valType : 'length'},
			{ruleName : 'innerweekdayframe', cssProp : 'backgroundColor', label : 'Background Color', valType : 'color'}
		]);
		createInputGroup('Week Days', [
			{ruleName : 'weekday', cssProp : 'color',           label : 'Font Color',       valType : 'color'},
			{ruleName : 'weekday', cssProp : 'fontFamily',      label : 'Font',             valType : 'length'},
			{ruleName : 'weekday', cssProp : 'fontWeight',      label : 'Bold',             valType : 'fontWeight'},
			{ruleName : 'weekday', cssProp : 'fontStyle',       label : 'Italic',           valType : 'fontStyle'},
			{ruleName : 'weekday', cssProp : 'fontSize',        label : 'Font Size',        valType : 'length'}
		]);

	}

	function initZoomControls () {

		function updateZoomLevel () {
			ui.$zoomInput.val((ui.zoomPort.scale() * 100) + '%');
		}

		ui.zoomPort = ZoomPort(document.getElementById('printacal-zoomport'));
		ui.$zoomInput = $('#printacal-zoom-input');

		$('#printacal-zoom-plus').on('click', function () {
			ui.zoomPort.scale(ui.zoomPort.scale() * 2);
			updateZoomLevel();
		});
		$('#printacal-zoom-minus').on('click', function () {
			ui.zoomPort.scale(ui.zoomPort.scale() / 2);
			updateZoomLevel();
		});
		$('#printacal-zoom-reset').on('click', function () {
			ui.zoomPort.scale(1);
			updateZoomLevel();
		});
		$('#printacal-zoom-input').on('change', function () {
			ui.zoomPort.scale(window.parseFloat(this.value) / 100);
			updateZoomLevel();
		});
		$('#printacal-zoom-fit').on('click', function () {
			ui.zoomPort.to({element : ui.$monthPage[0]});
			updateZoomLevel();
		});

		ui.zoomPort.scale(0.5);
		updateZoomLevel();

	}

	function initMonthControls () {

		var monthIndex = 0;

		function updateMonth () {
			if (monthIndex < 0) {monthIndex += MONTHS.length;}
			if (monthIndex >= MONTHS.length) {monthIndex -= MONTHS.length;}
			ui.$currentMonth.text(MONTHS[monthIndex].name);
		}

		function prevMonth () {
			jumpToMonth(--monthIndex);
			updateMonth();
		}

		function nextMonth () {
			jumpToMonth(++monthIndex);
			updateMonth();
		}

		ui.$currentMonth = $('#printacal-month-current');

		$('#printacal-month-prev').on('click', prevMonth);
		$('#printacal-month-next').on('click', nextMonth);
		$(document).on('keydown', function (e) {
			if (e.which === 37 || e.keycode === 37) { // Left
				prevMonth();
			}
			else if (e.which === 39 || e.keycode === 39) { // Right
				nextMonth();
			}
		});

		updateMonth();

	}

	function initUI () {

		// HTML Elements
		ui.$view = $('#printacal-page-view');
		ui.$year = $('#printacal-year');
		ui.$opts = $('#printacal-options');

		ui.$year.on('change', function () {
			data.year = ui.$year.val();
			setCalendar();
		});

		$('#printacal-print').on('click', window.print.bind(window));
		$('#printacal-show-opts').on('click', function () {
			$(this).parents('.wrapper-head').toggleClass('open');
		});

		// Custom CSS Input Fields
		initInputFields();

		// NOTE: spectrum.js only works on element already appended to the DOM
		// Delay spectrum init until after all inputs have been appended to the DOM
		$('input[type="color"]').each(function (i, input) {
			var $input = $(input);
			$input.spectrum({
				change : function () {$input.val($input.spectrum('get').toHexString());},
				allowEmpty : true,
				showInput  : true
			});
		});

		// Init Controls
		initZoomControls();
		initMonthControls();

	}

	function init () {
		initCustomStyleRules();
		initUI();
		ui.$year.attr('value', data.year = (new window.Date()).getYear() + 1900);
		setCalendar();
		setStyles(defaultStyles);
		init = null;
	}

	//
	// Set Calendar
	//

	function createDayBlock (dayIndex) {
		return (
			$('<div/>')
				.addClass(CSS_CLASS_NAMES.dayframe)
				.addClass(CSS_CLASS_NAMES.custom)
				.append(
					$('<div/>')
						.addClass(CSS_CLASS_NAMES.innerdayframe)
						.addClass(CSS_CLASS_NAMES.custom)
						.append(
							$('<div/>')
								.addClass(CSS_CLASS_NAMES.date)
								.addClass(CSS_CLASS_NAMES.custom)
								.text(dayIndex + 1)
						)
				)
		);
	}

	function createBlankBlock () {
		return (
			$('<div/>')
				.addClass(CSS_CLASS_NAMES.dayframe)
				.addClass('blank')
		);
	}

	function createWeekFrame () {
		var $newWeekFrame = $('<div/>')
				.addClass(CSS_CLASS_NAMES.weekframe)
				.addClass(CSS_CLASS_NAMES.custom);
		for (var i = 0, ii = WEEKDAYS.length; i < ii; i++) {
			$newWeekFrame.append(
				$('<div/>')
					.addClass(CSS_CLASS_NAMES.weekdayframe)
					.addClass(CSS_CLASS_NAMES.custom)
					.append(
						$('<div/>')
							.addClass(CSS_CLASS_NAMES.innerweekdayframe)
							.addClass(CSS_CLASS_NAMES.custom)
							.append(
								$('<div/>')
									.addClass(CSS_CLASS_NAMES.weekday)
									.addClass(CSS_CLASS_NAMES.custom)
									.text(WEEKDAYS[(i + 8) % 7].name)
							)
					)
			);
		}
		return $newWeekFrame;
	}

	function createGridFrame (year, monthIndex) {
		var startOfMonth  = (getDayOfWeek(year, monthIndex + 1, 1) + 6) % 7,
			days          = getDaysInAMonth(year, monthIndex + 1),
			$newGridFrame = $('<div/>')
				.addClass(CSS_CLASS_NAMES.gridframe)
				.addClass(CSS_CLASS_NAMES.custom),
			i;
		for (i = 0; i < startOfMonth; i++) {
			$newGridFrame.append(createBlankBlock());
		}
		for (i = 0; i < days; i++) {
			$newGridFrame.append(createDayBlock(i));
		}
		for (i = startOfMonth + days; i < 35; i++) {
			$newGridFrame.append(createBlankBlock());
		}
		return $newGridFrame;
	}

	function createMonthPage (year, monthIndex) {
		return (
			$('<div/>')
				.addClass(CSS_CLASS_NAMES.pageframe)
				.addClass(CSS_CLASS_NAMES.custom)
				.addClass('printacal-dropshadow')
				.append(
					$('<div/>')
						.addClass(CSS_CLASS_NAMES.outerframe)
						.addClass(CSS_CLASS_NAMES.custom)
						.append(
							$('<div/>')
								.addClass(CSS_CLASS_NAMES.headerframe)
								.addClass(CSS_CLASS_NAMES.custom)
								.append(
									$('<span/>')
										.addClass(CSS_CLASS_NAMES.headermonth)
										.addClass(CSS_CLASS_NAMES.custom)
										.text(MONTHS[monthIndex].name)
								)
								.append(
									$('<span/>')
										.addClass(CSS_CLASS_NAMES.headeryear)
										.addClass(CSS_CLASS_NAMES.custom)
										.text(data.year)
								)
						)
						.append(
							$('<div/>')
								.addClass(CSS_CLASS_NAMES.innerframe)
								.addClass(CSS_CLASS_NAMES.custom)
								.append(createWeekFrame())
								.append(createGridFrame(year, monthIndex))
						)
				)
		);
	}

	function setCalendar () {
		ui.$view.empty();
		for (var i = 0; i < MONTHS.length; i++) {
			ui.$view.append(createMonthPage(data.year, i));
		}
		ui.$monthPages = ui.$view.children('.' + CSS_CLASS_NAMES.pageframe);
		jumpToMonth(0);
	}

	//
	// Set Styles
	//

	function setStyleProp (ruleName, cssProp, cssVal) {

		var $input;
		cssVal = cssVal.toLowerCase();

		// Update corresponding input elements
		if (styleInputs[ruleName]) {
			$input = styleInputs[ruleName][cssProp];
		}
		if ($input) {
			$input.val(cssVal);
			if (cssProp === 'fontWeight') {
				$input.attr('checked', !!(cssVal === 'bold'));
			}
			else if (cssProp === 'fontStyle')  {
				$input.attr('checked', !!(cssVal === 'italic'));
			}
			else if ($input.attr('type') === 'color') {
				$input.spectrum('set', cssVal);
			}
		}

		// Set and store CSS property value
		if (!data.styles[ruleName]) {
			data.styles[ruleName] = {};
		}
		data.styles[ruleName][cssProp] = data.rules[ruleName].style[cssProp] = cssVal;

		// return value
		return data.rules[ruleName].cssText;

	};

	function setStyles (styleOpts) {
		for (var r in styleOpts) {if (styleOpts.hasOwnProperty(r)) {
			for (var p in styleOpts[r]) {if (styleOpts[r].hasOwnProperty(p)) {
				setStyleProp(r, p, styleOpts[r][p]);
			}}
		}}
	}

	//
	// Calendar Utilities
	//

	function isLeapYear (year) {
		     if (year % 4   !== 0) return false;
		else if (year % 100 !== 0) return true;
		else if (year % 400 !== 0) return false;
		else                       return true;
	}

	function getDaysInAMonth (year, month) {
		if (month === 2 && isLeapYear(year)) {
			return MONTHS[month - 1].days + 1;
		}
		else {
			return MONTHS[month - 1].days;
		}
	}

	function getDayOfWeek (year, month, day) {
		// SOURCE: http://mathforum.org/library/drmath/view/55837.html
		if (month === 1 || month === 2) {
			year  -= 1;
			month += 12;
		}
		return (
			(
				day +
				2 * month +
				window.Math.floor((3 * (month + 1)) / 5) +
				year +
				window.Math.floor(year / 4) -
				window.Math.floor(year / 100) +
				window.Math.floor(year / 400) +
				2
			) % 7
		);
	}

	//
	// Init
	//

	$(document).ready(ZoomPort.init);
	$(document).ready(init);

	//
	// Export
	//

	window.printacal = {
		setStyleProp : setStyleProp,
		exportStyles : function () {return window.JSON.stringify(data.styles);},
		importStyles : function (styleOpts) {
			if (typeof styleOpts === 'string') {styleOpts = window.JSON.parse(styleOpts);}
			setStyles(styleOpts);
		}
	};

})(window, document, jQuery, ZoomPort);
