/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

// requires: jquery
;(function(exports) {
    /* todo:
         * non-targeted touches:
            touchmove - when a touch (even if it didn't start over the element) moves
            touchenter
            touchleave
            touchend
         * consider this to detect mousemove events over objects the event didn't start over:
                document.elementFromPoint(event.clientX, event.clientY);
         * Use a *real* hashmap to find handlers to unbind instead of doing a brute force loop
            * https://github.com/flesler/hashmap
    */

    exports.touch = touch
    exports.untouch = untouch

    var handlerList = []

    // eventTypes should be a space-separated list of any of the event types: start
        // other eventTypes are reserved for when this can support notify about events that did not start over the original target
    // handler will get a touchjs TouchEvent object
    function touch(jqueryObject, eventTypes, handler) {
        var types = eventTypes.split(" ")
        if(types.indexOf('start') != -1) {
            var internalHandler = function(pEvent) {
                var that = this
                eachTouch(pEvent, function(touch) {
                    handler.call(that, new TouchEvent(pEvent, that, touch, pEvent.originalEvent.type))
                })
            }

            jqueryObject.on('touchstart', internalHandler)
            handlerList.push({internal: internalHandler, external: handler})
        }
    }

    function untouch(jqueryObject, eventTypes, handler) {
        if(handler === undefined) {
            jqueryObject.off(eventTypes)
        } else {
            var internalHandler;
            for(var n=0; n<handlerList.length; n++) {
                var handlers = handlerList[n]
                if(handler === handlers.external) {  // javascript maps can't use non-strings as keys : (
                    internalHandler = handlers.internal
                    break
                }
            }
            jqueryObject.off(eventTypes, internalHandler)
        }
    }

    function TouchEvent(pEvent, domObject, standardTouchObject, type) {
        this.id = standardTouchObject.identifier
        this.type = type
        this.screen = {x: standardTouchObject.screenX, y: standardTouchObject.screenY}
        this.client = {x: standardTouchObject.clientX, y: standardTouchObject.clientY}
        this.page = {x: standardTouchObject.pageX, y: standardTouchObject.pageY}

        var radiusX = standardTouchObject.radiusX || standardTouchObject.webkitRadiusX || 1
        var radiusY = standardTouchObject.radiusY || standardTouchObject.webkitRadiusY || 1
        var rotationAngle = standardTouchObject.rotationAngle || standardTouchObject.webkitRotationAngle || 0

        this.area = {radius:
                        {   x: radiusX,
                            y: radiusY
                        },
                        rotation: rotationAngle
                    }

        this.force = standardTouchObject.force || standardTouchObject.mozPressure
                     || standardTouchObject.mozPressure || standardTouchObject.webkitForce
                     || 1

        this.source = 'touch'

        this.targetTouches = pEvent.originalEvent.targetTouches
        this.allTouches = pEvent.originalEvent.touches

        // intended to be private
        this.target = domObject
        this.pEvent = pEvent
        this.internalHandlers = {}
        this.handlers = {touchend:[], touchcancel:[], touchmove:[], touchleave:[], touchenter:[]}
    }
        TouchEvent.prototype = {
            isDefaultPrevented: function() {
                return this.pEvent.isDefaultPrevented()
            },
            isImmediatePropagationStopped: function() {
                return this.pEvent.isImmediatePropagationStopped()
            },
            preventDefault: function() {
                return this.pEvent.preventDefault()
            },
            stopImmediatePropagation: function() {
                return this.pEvent.stopImmediatePropagation()
            },
            stopPropagation: function() {
                return this.pEvent.stopPropagation()
            },

            // eventTypes should be a space-separated list of any of the event types: end cancel move leave enter
                // these bind to changes in the specific touch (ignores other touches)
                // note that start isn't supported cause that doesn't make sense (you're binding to an already started touch event)
            // handler will get a touchjs TouchEvent object
            on: function(eventTypes, passedHandler) {
                var types = eventTypes.split(" ")

                var that = this
                var $target = $(this.target)

                function createHandler(typeToRequire, requestedType) {
                    var handler = function(pEvent) {
                        var subthis = this
                        eachTouch(pEvent, function(touch) {
                            if(touch.identifier === that.id) {
                                var touchEvent = new TouchEvent(pEvent, subthis, touch, requestedType)
                                runHandlers(typeToRequire, subthis, touchEvent)

                                if(typeToRequire === 'touchend' || typeToRequire === 'touchcancel')
                                    rmHandlers(that)

                                else if(that.over !== undefined && typeToRequire === 'touchmove') {
                                    var wasOver = that.over
                                    var isNowOver = isInBounds(touchEvent.page, nodeToRectangle($target))
                                    that.over = isNowOver

                                    if(wasOver && !isNowOver) {
                                        runHandlers('touchleave', subthis, touchEvent)
                                    } else if(!wasOver && isNowOver) {
                                        runHandlers('touchenter', subthis, touchEvent)
                                    }
                                }
                            }
                        })
                    }
                    return handler
                }

                function runHandlers(type, subthis, touchEvent) {
                    that.handlers[type].forEach(function(handler) {
                        handler.call(subthis, touchEvent)
                    })
                }

                function addExternalHandler(type) {
                    that.handlers[type].push(passedHandler)

                    var typeToRequire = type
                    if(type === 'touchleave' || type === 'touchenter') {
                        typeToRequire = 'touchmove'
                        if(that.over === undefined) {
                            that.over = isInBounds(that.page, nodeToRectangle($target))
                        }
                    }

                    if(!that.internalHandlers[typeToRequire]) {
                        var handler = createHandler(typeToRequire, type)
                        that.internalHandlers[typeToRequire] = handler
                        $target.on(typeToRequire, handler)
                    }
                }

                ;['end','cancel','move','leave', 'enter'].forEach(function(type) {
                    if(types.indexOf(type) != -1) {
                        addExternalHandler('touch'+type)
                    }
                })

                return this
            },

            off: function(eventTypes, originalPassedHandler) {
                var types = eventTypes.split(" ")

                var that = this
                types.forEach(function(type) {
                    addExternalHandler('touch'+type)
                    if(originalPassedHandler === undefined) {
                        that.handlers['touch'+type] = []
                    } else {
                        var typeHandlers = that.handlers['touch'+type]
                        for(var n=0; n<typeHandlers.length; n++) {
                            if(originalPassedHandler === typeHandlers[n]) {  // javascript maps can't use non-strings as keys : (
                                typeHandlers.splice(n,1) // remove that one
                                break
                            }
                        }
                    }
                })

                var $target = $(that.target)
                cleanUpInternalHandlers(['touchend'],                               'touchend')
                cleanUpInternalHandlers(['touchcancel'],                            'touchcancel')
                cleanUpInternalHandlers(['touchmove', 'touchleave', 'touchenter'],  'touchmove')

                function cleanUpInternalHandlers(typesToCheck, typeToRemove) {
                    var remove = typesToCheck.reduce(function(acc, type) {
                        return acc && that.handlers[type].length === 0
                    }, true)

                    if(remove) {
                        $target.off(typeToRemove, that.internalHandlers[typeToRemove])
                        that.internalHandlers[typeToRemove] = undefined
                    }
                }
            }
        }

    function rmHandlers(touchEvent) {
        var $target = $(touchEvent.target)
        for(var type in touchEvent.internalHandlers) {
            $target.off(type, touchEvent.internalHandlers[type])
        }
    }

    function eachTouch(pEvent, callback) {
        var touches = pEvent.originalEvent.changedTouches
        for(var i=0; i < touches.length; i++) {
            var touch = touches[i]
            callback(touch)
        }
    }

    function nodeToRectangle(node) {
        var offset = node.offset()
        return {x: offset.left, y: offset.top, width: node.outerWidth(), height: node.outerHeight()}
    }

    // point should be like {x:x, y:y}
    // rectangle should be like {x:x, y:y, height:height, width:width}
    //   where x,y is the top left point of the rectangle
    function isInBounds(point, rectangle) {
        return  point.x > rectangle.x && point.x < rectangle.x+rectangle.width &&
                point.y > rectangle.y && point.y < rectangle.y+rectangle.height
    }
})(this)