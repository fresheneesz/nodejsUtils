"use strict";

var Unit = require('../unit')
var proto = require('../proto')

Unit.test("Testing proto", function() {
	var Person = proto(function() {
        this.heads = 1              // static properties and inherited (prototype) properties are unified ..
                                    // .. properties can be accessed on the factory just like from the instance

        // constructor
        this.make = function(legs, arms) {
            this.legs = legs
            this.arms = arms
            return this
        }

        this.getCaughtInBearTrap = function() {
            this.legs = this.legs-1;
        }
        this.numberLimbs = function() {
            return this.arms + this.legs;
        }
    })

    var testPerson = function(me, p) {
        me.ok(p.legs === 2)
        p.getCaughtInBearTrap()
        me.ok(p.legs === 1)

        me.ok(p.numberLimbs() === 3)
    }

    this.test("Simple factory creation", function() {
        this.test("static access", function() {
            this.ok(Person.heads === 1)
        })
        this.test("instance", function() {
            var p = Person(2, 2)
            testPerson(this, p)
        })

    })

    var Girl = proto(Person, function() {
        this.make = function(legs, arms) {
            return Person.make.call(this, legs, arms) // test super-method calls
        }

        this.haveBaby = function() {
            return Person(2,2)
        }
    })

    this.test("Inheriting", function() {
        var g = Girl(2, 2);
        testPerson(this, g);

        var baby = g.haveBaby()
        testPerson(this, baby);
    })



    this.test("Inheriting native objects", function() {
        var UberObject1 = proto(function() {
            this.x = 5
        })
        var UberObject2 = proto(Object, function() {
            this.x = 5
        })

        Object.prototype.moo = "testing"
        Object.moo = "testing"

        var x = UberObject1()
        this.ok(x.x === 5)
        this.ok(x.moo === "testing")

        x = UberObject2()
        this.ok(x.x === 5)
        this.ok(x.moo === "testing")

        var BuberObject = proto(UberObject1, function() {

        })

        x = BuberObject()
        this.ok(x.x === 5)
        this.ok(x.moo === "testing")
    })

    /*
    this.test("Inheriting Error objects", function() {
        var MyError = proto(Error, function() {
            this.x = 5
        })

        var e = MyError("The Message")
        this.ok(e.message === "The Message")
        this.ok(e.x === 5)
    })
    */


}).writeConsole()

