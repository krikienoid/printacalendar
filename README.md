# Printable Calendars

###### A basic tool for creating and printing calendars.


[LINK](http://krikienoid.github.io/printacalendar/index.html)


## Info

This is a basic web app for designing and printing simple calendars.
Colors, size, fonts, and other features can be customized.

#### Note

The calendar's CSS can be fully edited using the method:
```javascript
    printacal.setStyleProp(ruleName, cssPropertyName, cssValue);
```
ruleName is used to target a class elements in the calendar and can be determined via the element's className, for example,
```
    <div class="printacal-date printacal-custom">26</div>
```
would have the ruleName "date".

Example:
```javascript
    printacal.setStyleProp("date", "fontFamily", "Arial");
```

## License

MIT licensed 2014