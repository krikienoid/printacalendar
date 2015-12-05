/*!
 * ZoomPort.js
 * 0.21.14
 * Ken Sugiura (2015)
 * https://github.com/krikienoid/zoomport.js
 *
 * based on zoom.js 0.3 by Hakim El Hattab
 * http://lab.hakim.se/zoom-js
 *
 * MIT licensed
 */

/**
 * ZoomPort closure
 *
 * @name ZoomPort
 * @namespace
 */
;(function (window, document, undefined) {

    //
    // Common
    //

    // Default Values
    var DEFAULT_PADDING     = 20,
        TRANSITION_FUNCTION = 'ease',
        TRANSITION_DURATION = 400,
        SAFETY_WAIT_TIME    = 100,
        TOTAL_WAIT_TIME     = TRANSITION_DURATION + SAFETY_WAIT_TIME,
        PAN_RANGE           = 0.12,
        PAN_DISTANCE        = 14,
        PAN_INTERVAL_TIME   = 1000 / 60;

    // Browser support
    var supportsTransforms,
        docBody,
        docElem;

    // The current mouse position, used for panning
    var mouseX = 0,
        mouseY = 0;

    //
    // Constructors
    //

    /**
     * ViewBox
     *
     * @private
     * @constructor
     * @param {Object} options
     *   @param {number} options.x
     *   @param {number} options.y
     *   @param {number} options.width
     *   @param {number} options.height
     */
    function ViewBox (options) {
        this.x      = options.x;
        this.y      = options.y;
        this.width  = options.width;
        this.height = options.height;
    }

    /**
     * Get the center point of viewBox.
     *
     * @returns {Object} pos
     */
    ViewBox.prototype.getCenter = function () {
        return {
            x : this.x + this.width  / 2,
            y : this.y + this.height / 2
        };
    };

    /**
     * Get bounding rectangle of viewBox.
     *
     * @returns {Object} rect
     */
    ViewBox.prototype.getRect = function () {
        return {
            left   : this.x,
            top    : this.y,
            right  : this.x + this.width,
            bottom : this.y + this.height,
            width  : this.width,
            height : this.height
        };
    };

    //
    // ZoomPort Object
    //

    /**
     * ZoomPort
     *
     * @memberof ZoomPort
     *
     * @private
     * @constructor
     * @param {Element} outerFrame - container element
     * @param {Element} innerFrame - zoomable content
     * @param {Object}  [options]
     *   @param {Element}  [options.element] - HTML element to zoom in on
     *   @param {number}   [options.padding] - spacing around the zoomed in element
     *   @param {number}   [options.x]       - coordinates in non-transformed space to zoom in on
     *   @param {number}   [options.y]       - coordinates in non-transformed space to zoom in on
     *   @param {number}   [options.width]   - the portion of the screen to zoom in on
     *   @param {number}   [options.height]  - the portion of the screen to zoom in on
     *   @param {number}   [options.scale]   - explicitly set scale
     *   @param {Function} [options.callback]      - call back when zooming ends
     *   @param {boolean}  [options.transitionsOn] - enable or disable transitions
     *   @param {boolean}  [options.panningOn]     - enable or disable panning
     */
    function ZoomPort (outerFrame, innerFrame, options) {

        //
        // Private Data
        //

        // Settings
        var level           = 1,
            isTransitionsOn = false,
            isPanningOn     = false;

        // Timeout before pan is activated
        var panEngageTimeout  = -1,
            panUpdateInterval = -1;

        // Timeout for callback function
        var callbackTimeout   = -1;

        // Timeout before magnify can be called again
        var transitionTimeout = -1;

        //
        // Getter and Setters
        //

        /**
         * Get or set scale.
         *
         * @param {number} [val]
         * @returns {number} scale
         */
        this.scale = function (val) {
            if (!window.isNaN(val) && val > 0) {
                this.to({scale : val});
            }
            return level;
        };

        /**
         * Get current viewBox.
         *
         * @returns {ViewBox} viewBox
         */
        this.viewBox = function () {
            var outerSize = getSize(outerFrame),
                scrollPos = getScrollPos(outerFrame);
            return new ViewBox({
                x      : scrollPos.x      / level,
                y      : scrollPos.y      / level,
                width  : outerSize.width  / level,
                height : outerSize.height / level
            });
        };

        /**
         * Enable or disable CSS transitions.
         *
         * @param {boolean} [val]
         * @returns {boolean} transitionsOn
         */
        this.transitionsOn = function (val) {
            if (val !== undefined) {
                if (supportsTransforms) {
                    isTransitionsOn = !!val;
                }
                else {
                    window.console.log(
                        'Error: ZoomPort: CSS3 transitions not supported.'
                    );
                }
            }
            return isTransitionsOn;
        };

        /**
         * Enable or disable automatic panning.
         *
         * @param {boolean} [val]
         * @returns {boolean} panningOn
         */
        this.panningOn = function (val) {
            if (val !== undefined) {
                val = !!val;
                if (val !== isPanningOn) {
                    isPanningOn = val;
                    if (isPanningOn) {

                        // Wait with engaging panning as it may conflict with the
                        // zoom transition
                        (function (pan) {
                            panEngageTimeout = window.setTimeout(
                                function () {
                                    panUpdateInterval =
                                        window.setInterval(pan, PAN_INTERVAL_TIME);
                                },
                                TOTAL_WAIT_TIME
                            );
                        })(pan.bind(this));

                    }
                    else {
                        window.clearTimeout(panEngageTimeout);
                        window.clearInterval(panUpdateInterval);
                    }
                }
            }
            return isPanningOn;
        };

        /**
         * Zoomable content HTML element.
         *
         * @member {Element} innerFrame
         */
        this.innerFrame = innerFrame;

        /**
         * Container HTML element.
         *
         * @member {Element} outerFrame
         */
        this.outerFrame = outerFrame;

        //
        // Public Methods
        //

        /**
         * Zooms in on either a user defined rectangle or an HTML element.
         *
         * @param {Object} options
         *   @param {Element}  [options.element] - HTML element to zoom in on
         *   @param {number}   [options.padding] - spacing around the zoomed in element
         *   @param {number}   [options.x]       - coordinates in non-transformed space to zoom in on
         *   @param {number}   [options.y]       - coordinates in non-transformed space to zoom in on
         *   @param {number}   [options.width]   - the portion of the screen to zoom in on
         *   @param {number}   [options.height]  - the portion of the screen to zoom in on
         *   @param {number}   [options.scale]   - explicitly set scale
         *   @param {Function} [options.callback]      - call back when zooming ends
         *   @param {boolean}  [options.transitionsOn] - enable or disable transitions
         *   @param {boolean}  [options.panningOn]     - enable or disable panning
         */
        this.to = function (options) {

            var zoomProp;

            if (options) {

                // Settings
                this.transitionsOn(options.transitionsOn);
                this.panningOn(options.panningOn);

                // Get scale and viewBox
                zoomProp = getZoomProp(this, options);

                // Magnify
                if (zoomProp.scale > 0 && transitionTimeout === -1) {

                    // Transition timeout
                    if (isTransitionsOn) {
                        transitionTimeout = window.setTimeout(
                            function () {transitionTimeout = -1;},
                            TOTAL_WAIT_TIME
                        );
                    }

                    // Magnify
                    magnify(this, zoomProp.scale, zoomProp.viewBox);
                    level = zoomProp.scale;

                    // Set callback function
                    window.clearTimeout(callbackTimeout);
                    if (typeof options.callback === 'function') {
                        callbackTimeout = window.setTimeout(
                            options.callback,
                            TOTAL_WAIT_TIME
                        );
                    }

                }

            }

        };

        //
        // Init
        //

        // Set innerFrame and outerFrame styles
        outerFrame.style.overflow = 'auto';
        innerFrame.style.display  = 'block';

        // Add events
        document.addEventListener('mousemove', panEvent.bind(this));

        // Reset scroll position
        setScrollPos(outerFrame, 0, 0);

        // Apply options
        this.to(options);

    }

    /**
     * Resets the document zoom state to its default.
     *
     * @param {Object} [options]
     *   @param {Function} [options.callback] - call back when zooming out ends
     */
    ZoomPort.prototype.out = function (options) {
        this.to({
            scale    : 1,
            callback : (options && options.callback) ? options.callback : null
        });
    };

    /**
     * Reset.
     */
    ZoomPort.prototype.reset = function () {this.out();};

    //
    // ZoomPort Private Functions
    //

    /**
     * Get zoom properties.
     *
     * @private
     * @param {ZoomPort} zoomPort
     * @param {Object}   options
     *   @param {Element} [options.element]
     *   @param {number}  [options.padding]
     *   @param {number}  [options.x]
     *   @param {number}  [options.y]
     *   @param {number}  [options.width]
     *   @param {number}  [options.height]
     *   @param {number}  [options.scale]
     * @returns {Object} zoomProp
     */
    function getZoomProp (zoomPort, options) {

        var level       = zoomPort.scale(),
            innerFrame  = zoomPort.innerFrame,
            outerFrame  = zoomPort.outerFrame,
            outerSize   = getSize(outerFrame),
            scrollPos   = getScrollPos(outerFrame),
            innerSize   = getSize(innerFrame),
            innerWidth  = innerSize.width  / level,
            innerHeight = innerSize.height / level,
            scale       = -1,
            viewBox     = zoomPort.viewBox(),
            padding     = 0,
            coords,
            bounds,
            ratio,
            viewBoxRect;

        // Calculate scale and viewBox based on options
        if (
            (
                isElem(options.element) || options.padding ||
                options.scale || options.x || options.y || options.width || options.height
            ) !== undefined
        )
        {

            // Calculate scale and viewBox
            if (
                isElem(options.element) &&
                options.element !== innerFrame &&
                options.element !== outerFrame
            )
            {

                // Default padding around the zoomed in element to leave on screen
                padding = DEFAULT_PADDING;

                // If an element is set, that takes precedence
                coords = getRelativePos(outerFrame, options.element);
                bounds = options.element.getBoundingClientRect();

                // Get viewBox
                viewBox.x      = coords.x;
                viewBox.y      = coords.y;
                viewBox.width  = bounds.width;
                viewBox.height = bounds.height;
                if (supportsTransforms) {
                    viewBox.width  /= level;
                    viewBox.height /= level;
                }

            }
            else {

                // Get scale value from options
                if (isElem(options.element)) {
                    scale = 1;
                }
                else if (!window.isNaN(options.scale)) {
                    scale = options.scale;
                }

                // If scale is known, get default viewBox
                if (scale > 0) {
                    viewBox = new ViewBox({
                        x      : viewBox.getCenter().x - (outerSize.width  / scale) / 2,
                        y      : viewBox.getCenter().y - (outerSize.height / scale) / 2,
                        width  : outerSize.width  / scale,
                        height : outerSize.height / scale
                    });
                }

                // Get x/y values from options
                if (!window.isNaN(options.x)) {viewBox.x = options.x;}
                if (!window.isNaN(options.y)) {viewBox.y = options.y;}

                // Get width/height values from options
                if (
                    scale <= 0 &&
                    (!window.isNaN(options.width) || !window.isNaN(options.height))
                ) {
                    viewBox.width  = options.width  || 1;
                    viewBox.height = options.height || 1;
                }

            }

            // Apply padding to viewBox
            if (!window.isNaN(options.padding)) {
                padding = options.padding;
            }
            viewBox.x      -= padding;
            viewBox.y      -= padding;
            viewBox.width  += padding * 2;
            viewBox.height += padding * 2;

            // Ensure viewBox is valid
            if (supportsTransforms) {

                // Ensure viewBox aspect ratio fits outerFrame
                ratio = outerSize.width / outerSize.height;
                if (ratio < viewBox.width / viewBox.height) {
                    // viewBox is too wide, increase height
                    viewBox.y += (viewBox.height - viewBox.width  / ratio) / 2;
                    viewBox.height = viewBox.width / ratio;
                }
                else if (ratio > viewBox.width / viewBox.height) {
                    // viewBox is too tall, increase width
                    viewBox.x += (viewBox.width  - viewBox.height * ratio) / 2;
                    viewBox.width = viewBox.height * ratio;
                }

                // Ensure viewBox is within outerFrame bounds
                viewBoxRect = viewBox.getRect();

                if (viewBoxRect.left < 0) {
                    viewBox.x = 0;
                }
                else if (viewBoxRect.right > innerWidth) {
                    viewBox.x -= viewBoxRect.right - innerWidth;
                }

                if (viewBoxRect.top < 0) {
                    viewBox.y = 0;
                }
                else if (viewBoxRect.bottom > innerHeight) {
                    viewBox.y -= viewBoxRect.bottom - innerHeight;
                }

            }

            // Ensure scale is known
            if (window.isNaN(scale) || scale <= 0) {
                scale = window.Math.min(
                    outerSize.width  / viewBox.width,
                    outerSize.height / viewBox.height
                );
            }

        }

        // Result
        return {
            scale   : scale,
            viewBox : viewBox
        };

    }

    /**
     * Applies the CSS required to zoom in, prefers the use of CSS3
     * transforms but falls back on zoom for IE.
     *
     * @private
     * @param {ZoomPort} zoomPort
     * @param {number}   scale
     * @param {ViewBox}  viewBox
     */
    function magnify (zoomPort, scale, viewBox) {

        var level           = zoomPort.scale(),
            innerFrame      = zoomPort.innerFrame,
            innerFrameStyle = innerFrame.style,
            outerFrame      = zoomPort.outerFrame,
            outerSize       = getSize(outerFrame),
            scrollPos       = getScrollPos(outerFrame),
            frameCenterX    = outerSize.width  / 2,
            frameCenterY    = outerSize.height / 2,
            newCenterX      = viewBox.x + viewBox.width  / 2,
            newCenterY      = viewBox.y + viewBox.height / 2,
            offsetX         = newCenterX * scale - frameCenterX,
            offsetY         = newCenterY * scale - frameCenterY,
            translateX,
            translateY,
            oldTransform,
            resetTranslate,
            origin,
            transform;

        if (supportsTransforms) {

            // Scale
            transform = 'scale(' + scale + ')';

            if (zoomPort.transitionsOn()) {

                // Reset
                origin         = newCenterX + 'px ' + newCenterY + 'px';
                oldTransform   = 'scale(' + level + ')' +
                    ' translate(' +
                    (frameCenterX * (1 - 1 / level)) + 'px, ' +
                    (frameCenterY * (1 - 1 / level)) + 'px)';
                resetTranslate = ' translate(' +
                    ((newCenterX - frameCenterX) * (1 - 1 / level)) + 'px, ' +
                    ((newCenterY - frameCenterY) * (1 - 1 / level)) + 'px)';

                setTransformOrigin(innerFrame, origin);
                setTransform(innerFrame, oldTransform + resetTranslate);

                // Transform
                translateX    = (newCenterX * (scale - 1)) - (offsetX - scrollPos.x);
                translateY    = (newCenterY * (scale - 1)) - (offsetY - scrollPos.y);

                transform    += ' translate(' +
                    (translateX / scale) + 'px, ' +
                    (translateY / scale) + 'px)';

                window.setTimeout(function () {

                    //setScrollingEnabled(outerFrame, false);

                    setTransformTransition(innerFrame, TRANSITION_DURATION, TRANSITION_FUNCTION);
                    setTransform(innerFrame, transform);

                    window.setTimeout(function () {

                        var origin    = frameCenterX + 'px ' + frameCenterY + 'px',
                            transform = 'scale(' + scale + ')' +
                                ' translate(' +
                                (frameCenterX * (1 - 1 / scale)) + 'px, ' +
                                (frameCenterY * (1 - 1 / scale)) + 'px)';

                        setTransformTransition(innerFrame, 0);
                        setTransformOrigin(innerFrame, origin);
                        setTransform(innerFrame, transform);

                        setScrollingEnabled(outerFrame, true);
                        setScrollPos(outerFrame, offsetX, offsetY);

                    }, TRANSITION_DURATION);

                }, SAFETY_WAIT_TIME);

            }
            else {

                setTransformOrigin(innerFrame, '0 0');
                setTransform(innerFrame, transform);

                setScrollPos(outerFrame, offsetX, offsetY);

            }

        }
        else {

            // Scale
            innerFrameStyle.position = 'relative';
            innerFrameStyle.left     = 0;
            innerFrameStyle.top      = 0;
            innerFrameStyle.width    = (scale * 100) + '%';
            innerFrameStyle.height   = (scale * 100) + '%';
            innerFrameStyle.zoom     = scale;

            setScrollPos(outerFrame, offsetX, offsetY);

        }

    }

    /**
     * Pan the document when the mouse cursor approaches the edges
     * of the viewport.
     *
     * @private
     */
    function pan () {

        var level        = this.scale(),
            outerFrame   = this.outerFrame,
            outerSize    = getSize(outerFrame),
            outerOffset  = (outerFrame === docElem) ?
                {left : 0, top : 0} : outerFrame.getBoundingClientRect(),
            scrollPos    = getScrollPos(outerFrame),
            rangeX       = outerSize.width  * PAN_RANGE,
            rangeY       = outerSize.height * PAN_RANGE,
            mouseOffsetX = mouseX - outerOffset.left,
            mouseOffsetY = mouseY - outerOffset.top;

        if (mouseOffsetY < rangeY && mouseOffsetY > 0) {

            // Up
            setScrollPos(
                outerFrame,
                scrollPos.x,
                scrollPos.y - (1 - (mouseOffsetY / rangeY)) * (PAN_DISTANCE / level)
            );

        }
        else if (mouseOffsetY > outerSize.height - rangeY && mouseOffsetY < outerSize.height) {

            // Down
            setScrollPos(
                outerFrame,
                scrollPos.x,
                scrollPos.y + (1 - (outerSize.height - mouseOffsetY) / rangeY) * (PAN_DISTANCE / level)
            );

        }

        if (mouseOffsetX < rangeX && mouseOffsetX > 0) {

            // Left
            setScrollPos(
                outerFrame,
                scrollPos.x - (1 - (mouseOffsetX / rangeX)) * (PAN_DISTANCE / level),
                scrollPos.y
            );

        }
        else if (mouseOffsetX > outerSize.width - rangeX && mouseOffsetX < outerSize.width) {

            // Right
            setScrollPos(
                outerFrame,
                scrollPos.x + (1 - (outerSize.width - mouseOffsetX) / rangeX) * (PAN_DISTANCE / level),
                scrollPos.y
            );

        }

    }

    //
    // Event Handlers
    //

    // Monitor mouse movement for panning
    function panEvent (e) {
        if (this.scale() > 1) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    }

    //
    // Utilities
    //

    /**
     * Checks if object is an HTML element.
     *
     * @param obj
     * @returns {boolean} isElement
     */
    function isElem (obj) {
        return !!(
            obj &&
            (typeof obj === 'object' || typeof obj === 'function') &&
            obj.tagName &&
            obj.nodeType &&
            (obj.nodeType === 1)
        );
    }

    /**
     * Get position of element relative to outerFrame.
     *
     * @private
     * @param {Element} outerFrame
     * @param {Element} elem
     * @returns {Object} pos
     */
    function getRelativePos (outerFrame, elem) {
        var x = elem.offsetLeft,
            y = elem.offsetTop;
        while (elem.offsetParent && elem !== docBody && elem !== outerFrame) {
            elem = elem.offsetParent;
            x += elem.offsetLeft;
            y += elem.offsetTop;
        }
        return {x : x, y : y};
    }

    /**
     * Get width and height of frame.
     *
     * @private
     * @param {Element} frame
     * @returns {Object} size
     */
    function getSize (frame) {
        if (frame === docElem) {
            return {
                width  : (window.innerWidth && docElem.clientWidth) ?
                    window.Math.min(window.innerWidth, docElem.clientWidth) :
                    window.innerWidth              ||
                    docElem.clientWidth            ||
                    docBody.parentNode.clientWidth ||
                    docBody.clientWidth,
                height : (window.innerHeight && docElem.clientHeight) ?
                    window.Math.min(window.innerHeight, docElem.clientHeight) :
                    window.innerHeight              ||
                    docElem.clientHeight            ||
                    docBody.parentNode.clientHeight ||
                    docBody.clientHeight
            };
        }
        else {
            return frame.getBoundingClientRect();
        }
    }

    /**
     * Get scroll offset position of frame.
     *
     * @private
     * @param {Element} frame
     * @returns {Object} pos
     */
    function getScrollPos (frame) {
        if (frame === docElem || frame === docBody) {
            return {
                x : window.pageXOffset            ||
                    docElem.scrollLeft            ||
                     docBody.parentNode.scrollLeft ||
                     docBody.scrollLeft,
                y : window.pageYOffset            ||
                    docElem.scrollTop             ||
                     docBody.parentNode.scrollTop  ||
                     docBody.scrollTop
            };
        }
        else {
            return {
                x : frame.scrollLeft,
                y : frame.scrollTop
            };
        }
    }

    /**
     * Set scroll offset position of frame.
     *
     * @private
     * @param {Element} frame
     * @param {number}  x
     * @param {number}  y
     */
    function setScrollPos (frame, x, y) {
        if (frame === docElem || frame === docBody) {
            window.scroll(x, y);
        }
        else {
            frame.scrollLeft = x;
            frame.scrollTop  = y;
        }
    }

    /**
     * Enable or disable scrolling on frame.
     *
     * @private
     * @param {Element} frame
     * @param {boolean} val
     */
    function setScrollingEnabled (frame, val) {
        frame.style.overflow = (val) ? 'auto' : 'hidden';
    }

    /**
     * Apply a transform to an element.
     *
     * @private
     * @param {Element} elem
     * @param {string}  val
     */
    function setTransform (elem, val) {
        var elemStyle = elem.style;
        elemStyle.transform       = val;
        elemStyle.OTransform      = val;
        elemStyle.msTransform     = val;
        elemStyle.MozTransform    = val;
        elemStyle.WebkitTransform = val;
    }

    /**
     * Set transform origin of an element.
     *
     * @private
     * @param {Element} elem
     * @param {string}  val
     */
    function setTransformOrigin (elem, val) {
        var elemStyle = elem.style;
        elemStyle.transformOrigin       = val;
        elemStyle.OTransformOrigin      = val;
        elemStyle.msTransformOrigin     = val;
        elemStyle.MozTransformOrigin    = val;
        elemStyle.WebkitTransformOrigin = val;
    }

    /**
     * Set CSS transition property for element transforms.
     * The easing that will be applied when we zoom in/out.
     *
     * @private
     * @param {Element} elem
     * @param {number}  transitionDuration
     * @param {string}  transitionFunction
     */
    function setTransformTransition (elem, transitionDuration, transitionFunction) {
        var elemStyle     = elem.style,
            transitionVal = (transitionDuration || 0) + 'ms ' + (transitionFunction || '');
        if (transitionDuration) {
            elemStyle.transition       = 'transform '         + transitionVal;
            elemStyle.OTransition      = '-o-transform '      + transitionVal;
            elemStyle.msTransition     = '-ms-transform '     + transitionVal;
            elemStyle.MozTransition    = '-moz-transform '    + transitionVal;
            elemStyle.WebkitTransition = '-webkit-transform ' + transitionVal;
        }
        else {
            elemStyle.transition       = '';
            elemStyle.OTransition      = '';
            elemStyle.msTransition     = '';
            elemStyle.MozTransition    = '';
            elemStyle.WebkitTransition = '';
        }
    }

    //
    // Export
    //

    /**
     * Creates ZoomPort object.
     *
     * @memberof ZoomPort
     *
     * @param {Element} outerFrame
     * @param {Element} [innerFrame]
     * @param {Object}  [options]
     *   @param {Element}  [options.element]
     *   @param {number}   [options.padding]
     *   @param {number}   [options.x]
     *   @param {number}   [options.y]
     *   @param {number}   [options.width]
     *   @param {number}   [options.height]
     *   @param {number}   [options.scale]
     *   @param {Function} [options.callback]
     *   @param {boolean}  [options.transitionsOn]
     *   @param {boolean}  [options.panningOn]
     * @returns {ZoomPort} zoomPort
     */
    window.ZoomPort = function (outerFrame, innerFrame, options) {

        // Options defined instead of innerFrame as second parameter
        if (options === undefined && innerFrame && !isElem(innerFrame)) {
            options = innerFrame;
        }

        // Get outerFrame and innerFrame
        if (outerFrame === window || outerFrame === document) {
            // Document as outerFrame
            outerFrame = docElem;
            innerFrame = docBody;
        }
        else if (isElem(outerFrame) && !isElem(innerFrame)) {
            // Default innerFrame
            innerFrame = outerFrame.firstElementChild;
        }

        // Create ZoomPort
        if (
            isElem(outerFrame) && isElem(innerFrame) &&
            innerFrame.parentNode === outerFrame
        )
        {
            return new ZoomPort(outerFrame, innerFrame, options);
        }
        else {
            window.console.log('Error: ZoomPort: Invalid parameters.');
        }

    };

    /**
     * Wait until DOM is loaded before initializing.
     */
    window.ZoomPort.init = function () {

        // Document aliases
        docBody = document.body;
        docElem = document.documentElement;

        // Check for transform support so that we can fallback otherwise
        supportsTransforms = 'WebkitTransform' in docBody.style ||
            'MozTransform'    in docBody.style ||
            'msTransform'     in docBody.style ||
            'OTransform'      in docBody.style ||
            'transform'       in docBody.style;

        window.ZoomPort.init = null;

    };

})(window, document);
