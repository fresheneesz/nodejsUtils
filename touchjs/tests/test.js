
$(function() {
    //phantomLimb.start()

    var button = $('<div>button</div>').css('font-size', 40)
    $("body").append(button)
    var button2 = $('<div>button2</div>').css('font-size', 40)
    $("body").append(button2)

    touch(button, 'start', function(event) {
        console.log("start")
        $(this).css({fontSize: 50})

        event.preventDefault()
        event.stopImmediatePropagation()
        event.stopPropagation()
        console.log("isDefaultPrevented: "+event.isDefaultPrevented()+", isImmediatePropagationStopped: "+event.isImmediatePropagationStopped())

        // subevent has the same structure as event (just has a different touch)
        event.on('end', function(subevent) {
            console.log("end")
            $(this).css({fontSize: 40})

            /*subevent.id
            subevent.screen
            subevent.client
            subevent.page
            subevent.area
            subevent.force
            subevent.targetTouches
            subevent.allTouches // all touches currently on the surface

            changedTouches
            targetTouches
            targetTouchestouches
            type

            Touch
                id
                screen
                client
                page
                area
                force
                target
            */

        })
        event.on('cancel', function(subevent) {
            console.log("cancel")
        })
        event.on('leave', function(subevent) {
            console.log("leave")
        })
        event.on('enter', function(subevent) {
            console.dir(subevent)
            console.log("enter")
        })
        event.on('move', function(subevent) {
            $(this).css({color: 'rgb('+(subevent.page.x%255)+',0,'+(subevent.page.y%255)+')'})
        })
    })

    // leave and enter are created, but not move
    touch(button2, 'start', function(event) {
        event.preventDefault()
        event.on('leave', function() {
            console.log("leave2")
        })
        event.on('enter', function() {
            console.log("enter2")
        })
    })
})