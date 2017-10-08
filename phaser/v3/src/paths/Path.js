//  Based on the three.js Curve classes created by [zz85](http://www.lab4games.net/zz85/blog)

var Class = require('../utils/Class');
var CubicBezierCurve = require('./curves/cubicbezier/CubicBezierCurve');
var EllipseCurve = require('./curves/ellipse/EllipseCurve');
var GameObjectFactory = require('../scene/plugins/GameObjectFactory');
var LineCurve = require('./curves/line/LineCurve');
var MoveTo = require('./MoveTo');
var Rectangle = require('../geom/rectangle/Rectangle');
var SplineCurve = require('./curves/spline/SplineCurve');
var Vector2 = require('../math/Vector2');

//  Local cache vars

var tmpVec2A = new Vector2();
var tmpVec2B = new Vector2();

var Path = new Class({

    initialize:

    function Path (x, y)
    {
        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }

        this.name = '';

        this.curves = [];

        this.cacheLengths = [];

        // Automatically closes the path
        this.autoClose = false;

        this.startPoint = new Vector2();

        if (typeof x === 'object')
        {
            this.fromJSON(x);
        }
        else
        {
            this.startPoint.set(x, y);
        }
    },

    moveTo: function (x, y)
    {
        this.add(new MoveTo(x, y));
    },

    //  Creates a line curve from the previous end point to x/y
    lineTo: function (x, y)
    {
        if (x instanceof Vector2)
        {
            tmpVec2B.copy(x);
        }
        else
        {
            tmpVec2B.set(x, y);
        }

        var end = this.getEndPoint(tmpVec2A);

        return this.add(new LineCurve([ end.x, end.y, tmpVec2B.x, tmpVec2B.y ]));
    },

    //  Creates a spline curve starting at the previous end point, using the given parameters
    splineTo: function (points)
    {
        points.unshift(this.getEndPoint());

        return this.add(new SplineCurve(points));
    },

    //  Creates a cubic bezier curve starting at the previous end point and ending at p3, using p1 and p2 as control points
    cubicBezierTo: function (x, y, control1X, control1Y, control2X, control2Y)
    {
        var p0 = this.getEndPoint();
        var p1;
        var p2;
        var p3;

        //  Assume they're all vec2s
        if (x instanceof Vector2)
        {
            p1 = x;
            p2 = y;
            p3 = control1X;
        }
        else
        {
            p1 = new Vector2(control1X, control1Y);
            p2 = new Vector2(control2X, control2Y);
            p3 = new Vector2(x, y);
        }

        return this.add(new CubicBezierCurve(p0, p1, p2, p3));
    },

    //  Creates an ellipse curve positioned at the previous end point, using the given parameters
    ellipseTo: function (xRadius, yRadius, startAngle, endAngle, clockwise, rotation)
    {
        var ellipse = new EllipseCurve(0, 0, xRadius, yRadius, startAngle, endAngle, clockwise, rotation);

        var end = this.getEndPoint(tmpVec2A);

        //  Calculate where to center the ellipse
        var start = ellipse.getStartPoint(tmpVec2B);

        end.sub(start);

        ellipse.x = end.x;
        ellipse.y = end.y;

        return this.add(ellipse);
    },

    circleTo: function (radius, clockwise, rotation)
    {
        if (clockwise === undefined) { clockwise = false; }

        return this.ellipseTo(radius, radius, 0, 360, clockwise, rotation);
    },

    getBounds: function (out, accuracy)
    {
        if (out === undefined) { out = new Rectangle(); }
        if (accuracy === undefined) { accuracy = 16; }

        out.x = Number.MAX_SAFE_INTEGER;
        out.y = Number.MAX_SAFE_INTEGER;

        var bounds = new Rectangle();
        var maxRight = Number.MIN_SAFE_INTEGER;
        var maxBottom = Number.MIN_SAFE_INTEGER;

        for (var i = 0; i < this.curves.length; i++)
        {
            var curve = this.curves[i];

            if (!curve.active)
            {
                continue;
            }

            curve.getBounds(bounds, accuracy);

            out.x = Math.min(out.x, bounds.x);
            out.y = Math.min(out.y, bounds.y);

            maxRight = Math.max(maxRight, bounds.right);
            maxBottom = Math.max(maxBottom, bounds.bottom);
        }

        out.right = maxRight;
        out.bottom = maxBottom;

        return out;
    },

    /**
     * Convert JSON
     *
     * @method fromJSON
     *
     * @param {[type]} data [description]
     *
     * @return {[type]} [description]
     */
    fromJSON: function (data)
    {
        //  data should be an object matching the Path.toJSON object structure.

        this.curves = [];
        this.cacheLengths = [];

        this.startPoint.set(data.x, data.y);

        this.autoClose = data.autoClose;

        for (var i = 0; i < data.curves.length; i++)
        {
            var curve = data.curves[i];

            switch (curve.type)
            {
                case 'LineCurve':
                    this.add(LineCurve.fromJSON(curve));
                    break;

                case 'EllipseCurve':
                    this.add(EllipseCurve.fromJSON(curve));
                    break;

                case 'SplineCurve':
                    this.add(SplineCurve.fromJSON(curve));
                    break;

                case 'CubicBezierCurve':
                    this.add(CubicBezierCurve.fromJSON(curve));
                    break;
            }
        }

        return this;
    },

    toJSON: function ()
    {
        var out = [];

        for (var i = 0; i < this.curves.length; i++)
        {
            out.push(this.curves[i].toJSON());
        }

        return {
            type: 'Path',
            x: this.startPoint.x,
            y: this.startPoint.y,
            autoClose: this.autoClose,
            curves: out
        };
    },

    add: function (curve)
    {
        this.curves.push(curve);

        return this;
    },

    getStartPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        return out.copy(this.startPoint);
    },

    getEndPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        if (this.curves.length > 0)
        {
            this.curves[this.curves.length - 1].getPoint(1, out);
        }
        else
        {
            out.copy(this.startPoint);
        }

        return out;
    },

    closePath: function ()
    {
        // Add a line curve if start and end of lines are not connected
        var startPoint = this.curves[0].getPoint(0);
        var endPoint = this.curves[this.curves.length - 1].getPoint(1);

        if (!startPoint.equals(endPoint))
        {
            //  This will copy a reference to the vectors, which probably isn't sensible
            this.curves.push(new LineCurve(endPoint, startPoint));
        }

        return this;
    },

    // To get accurate point with reference to
    // entire path distance at time t,
    // following has to be done:

    // 1. Length of each sub path have to be known
    // 2. Locate and identify type of curve
    // 3. Get t for the curve
    // 4. Return curve.getPointAt(t')

    getPoint: function (t, out)
    {
        if (out === undefined) { out = new Vector2(); }

        var d = t * this.getLength();
        var curveLengths = this.getCurveLengths();
        var i = 0;

        while (i < curveLengths.length)
        {
            if (curveLengths[i] >= d)
            {
                var diff = curveLengths[i] - d;
                var curve = this.curves[i];

                var segmentLength = curve.getLength();
                var u = (segmentLength === 0) ? 0 : 1 - diff / segmentLength;

                return curve.getPointAt(u, out);
            }

            i++;
        }

        // loop where sum != 0, sum > d , sum+1 <d
        return null;
    },

    getLength: function ()
    {
        var lens = this.getCurveLengths();

        return lens[lens.length - 1];
    },

    // cacheLengths must be recalculated.
    updateArcLengths: function ()
    {
        this.cacheLengths = [];

        this.getCurveLengths();
    },

    getCurveLengths: function ()
    {
        // We use cache values if curves and cache array are same length

        if (this.cacheLengths.length === this.curves.length)
        {
            return this.cacheLengths;
        }

        // Get length of sub-curve
        // Push sums into cached array

        var lengths = [];
        var sums = 0;

        for (var i = 0; i < this.curves.length; i++)
        {
            sums += this.curves[i].getLength();

            lengths.push(sums);
        }

        this.cacheLengths = lengths;

        return lengths;
    },

    getSpacedPoints: function (divisions)
    {
        if (divisions === undefined) { divisions = 40; }

        var points = [];

        for (var i = 0; i <= divisions; i++)
        {
            points.push(this.getPoint(i / divisions));
        }

        if (this.autoClose)
        {
            points.push(points[0]);
        }

        return points;
    },

    getPoints: function (divisions)
    {
        if (divisions === undefined) { divisions = 12; }

        var points = [];
        var last;

        for (var i = 0; i < this.curves.length; i++)
        {
            var curve = this.curves[i];

            if (!curve.active)
            {
                continue;
            }

            var resolution = curve.getResolution(divisions);

            var pts = curve.getPoints(resolution);

            for (var j = 0; j < pts.length; j++)
            {
                var point = pts[j];

                if (last && last.equals(point))
                {
                    // ensures no consecutive points are duplicates
                    continue;
                }

                points.push(point);

                last = point;
            }
        }

        if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0]))
        {
            points.push(points[0]);
        }

        return points;
    },

    draw: function (graphics, pointsTotal)
    {
        for (var i = 0; i < this.curves.length; i++)
        {
            var curve = this.curves[i];

            if (!curve.active)
            {
                continue;
            }

            curve.draw(graphics, pointsTotal);
        }

        return graphics;
    },

    destroy: function ()
    {
        this.curves.length = 0;
        this.cacheLengths.length = 0;
        this.startPoint = undefined;
    }

});

//  When registering a factory function 'this' refers to the GameObjectFactory context.
//  
//  There are several properties available to use:
//  
//  this.scene - a reference to the Scene that owns the GameObjectFactory
//  this.displayList - a reference to the Display List the Scene owns
//  this.updateList - a reference to the Update List the Scene owns

GameObjectFactory.register('path', function (x, y)
{
    return new Path(x, y);
});

module.exports = Path;
