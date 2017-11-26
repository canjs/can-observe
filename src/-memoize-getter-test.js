var QUnit = require('steal-qunit');
var memoizeGetter = require('./-memoize-getter');
var canReflect = require("can-reflect");
var SimpleObservable = require("can-simple-observable");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");

QUnit.module('helpers/-memoize-getter');

QUnit.test('basics', function(){
    var calls = [];
    var Type = function(first, second){
        this.first = new SimpleObservable(first);
        this.second = new SimpleObservable(second);
    };
    Type.prototype = {
        get fullName(){
            var first = this.first.get(),
                second = this.second.get(),
                result = first + " " + second;
            calls.push("fullName "+result);
            return result;
        }
    };
    var descriptor = Object.getOwnPropertyDescriptor(Type.prototype, "fullName");
    var getObservationDataFor = memoizeGetter.memoize(Type.prototype,"fullName",descriptor);

    var me = new Type("Justin","Meyer");

    QUnit.equal(me.fullName, "Justin Meyer", "getter read");

    var observationData = getObservationDataFor(me);

    canReflect.onValue(observationData.observation, function(newVal){
        calls.push("binding "+newVal);
    });
    var res;

    res = me.fullName;
    res = me.fullName;

    me.first.set("Ramiya");

    QUnit.deepEqual(calls,[
        "fullName Justin Meyer",
        "fullName Justin Meyer",
        "fullName Ramiya Meyer",
        "binding Ramiya Meyer"
    ],"calls in right order");

});

QUnit.test('works with observations', function(){
    var calls = [];
    var Type = function(first, second){
        this.first = new SimpleObservable(first);
        this.second = new SimpleObservable(second);
    };
    Type.prototype = {
        get fullName(){
            var first = this.first.get(),
                second = this.second.get(),
                result = first + " " + second;
            calls.push("fullName "+result);
            return result;
        }
    };


    var descriptor = Object.getOwnPropertyDescriptor(Type.prototype, "fullName");
    var getObservationDataFor = memoizeGetter.memoize(Type.prototype,"fullName",descriptor);

    Type.prototype[canSymbol.for("can.onKeyValue")] = function(key, handler, queue){
        var context = this;
        calls.push("me.onKeyValue "+key);
        canReflect.onValue( getObservationDataFor(context).observation, function(newVal){
            calls.push("me.onKeyValue observation handler");
            handler(newVal);
        },"notify");
    };

    var me = new Type("Justin","Meyer");

    var fullNameObservation = new Observation(function(){
        calls.push("calculating observation");
        return me.fullName;
    });

    canReflect.onValue(fullNameObservation, function(newVal){
        calls.push("binding "+newVal);
    });

    me.first.set("Ramiya");

    QUnit.deepEqual(calls,[
        "calculating observation",
        "fullName Justin Meyer",
        "me.onKeyValue fullName",
        "fullName Ramiya Meyer",
        "me.onKeyValue observation handler",
        "calculating observation",
        "binding Ramiya Meyer"
    ],"calls in right order");

});
