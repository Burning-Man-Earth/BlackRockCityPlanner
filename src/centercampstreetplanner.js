var Utils = require('./utils');
var Clock = require('./clock');
var Streets = require('./streets');
var Geo = require('./geo');
var Grid = require('./grid');
var turf = require('turf');

var CenterCampStreetPlanner = function(centerCampCenter,centerCampInfo,bearing,rodRoadintersections,ARoadName,portalAngle) {
    this.center = centerCampCenter;
    this.centerCampInfo = centerCampInfo;
    this.bearing = bearing;
    this.rodRoadintersections = rodRoadintersections;
    this.ABearingArray = [];
    this.ARoadName = ARoadName;
    this.portalAngle = portalAngle;
    this.rodRoadintersections.forEach(function(point){
        if (point.properties.ref === 'a') {
            var bearing = turf.bearing(this.center,point);
            this.ABearingArray.push(bearing);
        }
    },this);

    var minFrequency = 5;
    this.frequency =  360.0/(60.0/minFrequency*12.0);

    this.grid = new Grid(this.center,this.bearing,null,'miles');

    // 1. Generate Rod Road
    this.generateRodRoad();
    // 2. Generate Center camp plaza center line
    this.generateCenterCampCenterline();
    // 3. Generate straight A road
    this.generateARoad();
    // 4. Generate Rt 66 roads
    this.generateRt66();
};

CenterCampStreetPlanner.prototype.generateRodRoad = function () {
    var miles = Utils.feetToMiles(this.centerCampInfo.rod_road_distance);
    var points = Geo.arcPoints(this.center,miles,'miles',0,360,this.frequency);
    points.forEach(function(point){
        this.grid.saveWithBearing(point.properties.bearing,point.properties.distance,point.geometry.coordinates);
    },this);
    this.rodRoadintersections.forEach(function(point){
        var bearing = turf.bearing(this.center,point);
        this.grid.saveWithBearing(bearing,miles,point.geometry.coordinates);
    },this);
};


CenterCampStreetPlanner.prototype.generateCenterCampCenterline = function () {
    var distance = Utils.feetToMiles(this.centerCampPlazaCenterlineDistance());
    var points = Geo.arcPoints(this.center,distance,'miles',0,360,this.frequency);
    points.forEach(function(point){
        this.grid.saveWithBearing(point.properties.bearing,point.properties.distance,point.geometry.coordinates);
    },this);
};

CenterCampStreetPlanner.prototype.generateARoad = function () {
    var distance = Utils.feetToMiles(this.centerCampPlazaCenterlineDistance());
    this.ABearingArray.forEach(function(bearing){
        //Create point on center camp centerline
        var point = turf.destination(this.center,distance,bearing,'miles');
        this.grid.saveWithBearing(bearing,distance,point.geometry.coordinates);
    },this);
};

CenterCampStreetPlanner.prototype.generateRt66 = function () {
    var sortedBearings = this.ABearingArray.sort();
    var ARoadNegBearing = sortedBearings[0];
    var ARoadPosBearing = sortedBearings[1];

    var ManFacignDistance = Utils.feetToMiles(this.centerCampInfo.six_six_distance.man_facing);
    var sixFacingDistance = Utils.feetToMiles(this.centerCampInfo.six_six_distance.six_facing);

    var leftBearingOfPortal = this.bearing - this.portalAngle/2.0;
    var rightBearingOfPortal = this.bearing + this.portalAngle/2.0;

    var points = [];
    points = points.concat(Geo.arcPoints(this.center,ManFacignDistance,'miles',ARoadNegBearing,0,this.frequency));
    points = points.concat(Geo.arcPoints(this.center,ManFacignDistance,'miles',0,leftBearingOfPortal,this.frequency));
    points = points.concat(Geo.arcPoints(this.center,ManFacignDistance,'miles',rightBearingOfPortal,ARoadPosBearing,this.frequency));
    points = points.concat(Geo.arcPoints(this.center,sixFacingDistance,'miles',ARoadPosBearing,ARoadNegBearing,this.frequency));

    points.forEach(function(point){
        this.grid.saveWithBearing(point.properties.bearing,point.properties.distance,point.geometry.coordinates);
    },this);
};

////////////////////////////////////////

CenterCampStreetPlanner.prototype.getRodRoad = function() {
    var miles = Utils.feetToMiles(this.centerCampInfo.rod_road_distance);
    var points = this.grid.allPointsAlongDistance(miles);
    //All points along distance won't close the loop to create a full circle
    //This should do the trick
    points.push(points[0]);
    var properties = {
        "name": "Rod's Road",
        "ref": "rod"
    };
    return turf.linestring(points,properties);
};

CenterCampStreetPlanner.prototype.centerCampPlazaCenterlineDistance = function() {
    var distance = (this.centerCampInfo.cafe_plaza_radius - this.centerCampInfo.cafe_radius)/2.0 + this.centerCampInfo.cafe_radius;
    return distance;
}

CenterCampStreetPlanner.prototype.getCenterCampPlazaCenterline = function() {
    var distance = Utils.feetToMiles(this.centerCampPlazaCenterlineDistance());
    var points = this.grid.allPointsAlongDistance(distance);
    points.push(points[0]);
    var properties = {
        "ref": "centerCampPlazaRoad",
        "name": "Inner Circle"
    };
    return turf.linestring(points,properties);
};

CenterCampStreetPlanner.prototype.getARoad = function() {
    var points = [];
    this.ABearingArray.forEach(function(bearing){
        var startDistance = Utils.feetToMiles(this.centerCampPlazaCenterlineDistance());
        var endDistance = Utils.feetToMiles(this.centerCampInfo.rod_road_distance);
        var segmentPoints = this.grid.allPointsAlongBearing(bearing,startDistance,endDistance);
        points.push(segmentPoints);
    },this);
    var properties = {
        ref: 'a',
        name: this.ARoadName,
        type: 'arc'
    };
    return turf.multilinestring(points,properties);
}

CenterCampStreetPlanner.prototype.get66Road = function() {
    var sortedBearings = this.ABearingArray.sort();
    var ARoadNegBearing = sortedBearings[0];
    var ARoadPosBearing = sortedBearings[1];

    var ManFacignDistance = Utils.feetToMiles(this.centerCampInfo.six_six_distance.man_facing);
    var sixFacingDistance = Utils.feetToMiles(this.centerCampInfo.six_six_distance.six_facing);

    var leftBearingOfPortal = this.bearing - this.portalAngle/2.0;
    var rightBearingOfPortal = this.bearing + this.portalAngle/2.0;

    var points = [];
    //This is not the 'right' way to to do this becauase our bearing compare function screws up around 0/360
    var firstArc = this.grid.allPointsAlongDistance(ManFacignDistance,[ARoadNegBearing,359])
    firstArc = firstArc.concat(this.grid.allPointsAlongDistance(ManFacignDistance,[0,leftBearingOfPortal]));
    points.push(firstArc);
    points.push(this.grid.allPointsAlongDistance(ManFacignDistance,[rightBearingOfPortal,ARoadPosBearing]));
    points.push(this.grid.allPointsAlongDistance(sixFacingDistance));

    var properties = {
        "ref":"66",
        "name":"Route 66",
        "width":this.centerCampInfo.six_six_width
    };
    return turf.multilinestring(points,properties);
}

CenterCampStreetPlanner.prototype.getAllStreets = function() {
    var features = [];
    features.push(this.get66Road());
    features.push(this.getARoad());
    features.push(this.getCenterCampPlazaCenterline());
    features.push(this.getRodRoad());
    return turf.featurecollection(features);
}

module.exports = CenterCampStreetPlanner;
