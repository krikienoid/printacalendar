# Printable Calendar Maker

###### A minimal calendar builder.

 -- working version --

[Demo HERE](http://krikienoid.github.io/nicecalendar/index.html)


## Printable Calendar Maker

 - Editable calendar made using HTML and CSS
 - Adjustable size
 - Printable

```javascript
/* Although the UI is pretty limited, the calendar's
 * CSS can be fully edited through the method:
 *
 * niceCalendar.setProp(cssRuleName, cssPropertyName, cssValue)
 *
 * cssRuleName can be determined via the element's className, so
 * <div class="nice-calendar-date custom">26</div> would have
 * the cssRuleName "date".
 */

//Example:
niceCalendar.setProp("date", "fontFamily", "Arial");
```

## License

MIT licensed 2014