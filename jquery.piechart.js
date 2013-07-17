/**
 * jQuery Piechart v1.0
 *
 * Copyright 2013 David Orr
 *
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

(function($) {

  // -------------------------------------------------------
  // @class Piece
  //
  // A piece/slice/division of a <PieChart>. Creates an
  // HTML5 canvas element to wrap around.
  // @constructor Constructs a new instance of <tt>Piece</tt> with
  // the specified container and canvas. An array of options
  // may also be given.
  //
  // @param {DOMNode} container : the parent DOM element containing all pieces
  // @param {jObject} canvas    : the jQuery object holding the canvas element
  // @param {object}  [options] : optional options for the piece
  // -------------------------------------------------------
  function Piece(container, canvas, options) {
    this.$canvas = canvas;                     // {jObject} $canvas : the jQuery object holding the canvas element
    this.color = options.color;                // {string} color : the color to use for the piece
    this.radians = options.radians;            // {int} radians : the start and end points, in radians, to fill in the circle
    this.ctx = canvas.get(0).getContext('2d'); // {object} ctx : the canvas's 2d context
    this.borderWidth = options.borderWidth;    // {int} borderWidth : the width of the border
    this.borderColor = options.borderColor;    // {string} borderColor : the color of the border
  };

  // @instancemethod Piece#draw
  //
  // Renders the piece in its canvas element.
  // ----------------------------------------
  Piece.prototype.draw = function() {
    var ctx = this.ctx;
    var radius = this.$canvas.width()/2 - 20; // 20 should be legends margin-top
    var center = this.$canvas.width()/2;
    var radians = this.radians;

    // fill in the pieces
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center,
        center,
        radius,
        2 * Math.PI * radians.start,
        2 * Math.PI * radians.end,
        false);
    ctx.fillStyle = this.color;
    ctx.fill();

    // outline the pieces
    if (this.borderWidth !== 0) {
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = this.borderWidth;
      ctx.lineTo(center, center);
      ctx.stroke();
    }
  };

  // -------------------------------------------------------
  // @class PieChart
  //
  // A container for one or more <Piece>s
  //
  // @param {DOMNode} element : the HTML DOM element wrapper
  // @param {object}  options : settings for the pie chart
  // -------------------------------------------------------
  function PieChart(element, options) {
    this.pieces = [];       // {array} pieces : an array of <Piece> objects
    this.element = element; // {DOMNode} element : the DOM element associated with the pie chart
    this.options = options; // {object} options : settings for the pie chart

    this.init();
    this.display();
  };

  // @instancemethod PieChart#init
  //
  // Draws the entire chart on the canvas.
  // ----------------------------------------
  PieChart.prototype.display = function() {
    var pieces = this.pieces;
    var options = this.options;
    for (var i = 0, l = options.percentages.length; i < l; i++) {
        pieces[i].draw(options);
      }
  }

  // @im PieChart#init
  //
  // Initializes a <PieChart>.
  // ----------------------------------------
  PieChart.prototype.init = function() {
    var element = this.element;
    var $canvas = this.$canvas = $('<canvas></canvas>');
    this.ctx = $canvas.get(0).getContext('2d');
    var canvas = $canvas.get(0);
    $(element).append($canvas);
    $canvas.css('float', 'left');
    $canvas.addClass(this.options.chartClass);

    // canvas.height = $(element).height();
    // canvas.width = canvas.height;
    canvas.height = canvas.width = this.options.height;
    $(element).height(canvas.height + (canvas.height * 1 / 5));

    if (this.options.showLegend) {
      this.initLegend();
    }
    this.initHeader();
    this.initPieces();
    this.variable = 'something';
    $canvas.bind('mousemove', this.onhover());
    $canvas.bind('mouseleave', this.onmouseleave());

    this.prevPiece = '';
  }

  // @instancemethod PieChart#initPieces
  //
  // Creates the <Piece>s that go in the PieChart.
  // ----------------------------------------
  PieChart.prototype.initPieces = function() {
    var options = this.options;
    var pieces = this.pieces;
    var element = this.element;
    var pieceOptions = {};
    var percentages = options.percentages;
    var divisions = percentages.length;

    // check if enough colors were given
    if (options.colors.length < divisions) {
      throw "Not enough colors given.";
    }

    // change format of percentages if given in running total
    if (percentages[percentages.length-1] === 100) {
      for (var i = 0, prevNum = 0; i < divisions; i++) {
        var perc = percentages[i];
        if (prevNum > perc) {
          throw "Invalid percentage values";
        }
        percentages[i] = perc - prevNum;
        prevNum = perc;
      }
      // percentages = options.percentages;
    }

    // check if total percentages equals 100
    var totalPerc = 0;
    for (var i = divisions; i--; ) {
      totalPerc += percentages[i];
    }
    if (totalPerc !== 100) {
      throw "Invalid percentage values";
    }

    // generate the radians and create each new Piece
    for (var i = prevPos = 0; i < divisions; i++) {
      var radians = {
        start: prevPos,
        end: prevPos + (percentages[i]) / 100
      };
      prevPos = radians.end;
      pieceOptions.radians = radians;
      pieceOptions.color = options.colors[i];
      pieceOptions.borderWidth = options.borderWidth;
      pieceOptions.borderColor = options.borderColor;
      pieces.push(new Piece(element, this.$canvas, pieceOptions));
    }
  }

  // @instancemethod PieChart#initHeader
  //
  // Initializes the header.
  // ----------------------------------------
  PieChart.prototype.initHeader = function() {
    this.header = new Header(this.element, this.options);
  }

  // @instancemethod PieChart#initLegend
  //
  // Initializes the legend.
  // ----------------------------------------
  PieChart.prototype.initLegend = function() {
    this.legend = new Legend(this.element, this.options);
  }

  // @event PieChart#onhover
  //
  // Event handler for onhover.
  // ----------------------------------------
  PieChart.prototype.onhover = function() {
    var piechart = this;
    return function(e) {
      var canoffset = piechart.$canvas.offset();
      var mouseX = e.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft - Math.floor(canoffset.left);
      var mouseY = e.clientY + document.body.scrollTop +
          document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;

      var p = piechart.ctx.getImageData(mouseX, mouseY, 1, 1).data;
      var hex = '#' + ('000000' + rgbToHex(p[0], p[1], p[2])).slice(-6);

      if (p[3] != 0 && piechart.legend.item[hex] != undefined) {
        piechart.currPiece = piechart.legend.item[hex]['label'];

        if (piechart.prevPiece !== piechart.currPiece) {
          if (piechart.prevPiece != '') {
            PieChart.clearEffects(piechart.prevPiece);
          }
          PieChart.addEffects(piechart.currPiece, hex);
        }

        piechart.prevPiece = piechart.currPiece;
      } else {
        if (piechart.prevPiece != '') {
          PieChart.clearEffects(piechart.prevPiece);
          piechart.prevPiece = '';
        }
      }
    }
  }

  // @event PieChart#onmouseleave
  //
  // Event handler for onmouseleave events.
  // <p>Sometimes if the mouse leaves the canvas too fast,
  // the effects are not cleared. In those cases, this
  // function takes care of that.</p>
  PieChart.prototype.onmouseleave = function() {
    var piechart = this;
    return function(e) {
      if (piechart.prevPiece != '') {
        PieChart.clearEffects(piechart.prevPiece);
      }
    }
  }

  // @staticmethod PieChart#addEffects
  //
  // @param {DOMNode} item : the div to apply the effects to
  // @param {string} color : the color of the <Piece> being hovered
  PieChart.addEffects = function(item, color) {
    item.css('font-weight', 'bold');
    $(item.children()[0]).css('box-shadow', '0 0 1px 0 ' + color);
  }

  // @staticmethod PieChart#clearEffects
  // Reset the pie chart to its normal state.
  // @param {DOMNode} item : the div to reset
  PieChart.clearEffects = function(item) {
    item.css('font-weight', 'normal');
    $(item.children()[0]).css('box-shadow', 'none');
    item = '';
  }

  // -------------------------------------------------------
  // @class Header
  //
  // A title bar for the <PieChart>.
  //
  // @param {DOMNode} element : the HTML DOM element wrapper
  // @param {object}  options : settings for the header
  // -------------------------------------------------------
  function Header(element, options) {
    var $element = $(element);
    var $header = $('<div></div>');
    $header.height($element.height() * 1 / 6);
    var height = $header.height();
    $header.width('100%');
    var $title = $('<span>'+options.title+'</span>');
    $title.width($element.width()/2);
    $title.css('font-size', height - (height*1/4) + 'px');
    $header.css('text-align', 'center');
    $header.css('line-height', $header.height() + 'px');
    var justification = options.titleJustify;
    if (justification === 'left') {
      $title.css('float', 'left');
    } else if (justification === 'right') {
      $title.css('float', 'right');
    }
    $title.addClass(options.titleClass);

    $header.append($title);
    $element.prepend($header);
  }

  // -------------------------------------------------------
  // @class Legend
  //
  // A legend for the a <PieChart>.
  //
  // @param {DOMNode} element : the HTML DOM element wrapper
  // @param {object}  options : settings for the legend
  // -------------------------------------------------------
  function Legend(element, options) {
    var $element = $(element);
    console.log($element);
    console.log($element.width());
    var $legendOuter = $('<div></div>');
    var $legend = $('<div></div>');
    $legendOuter.height($element.height() * 5 / 6);
    $legendOuter.width($element.width() / 2);
    $legendOuter.css('float', 'left');
    $legendOuter.css('position', 'relative');
    $legendOuter.css('left', $element.height() * 1 / 7 + 'px');
    // $legend.css('margin-top', '30px');
    $legend.css('position', 'absolute');
    $legend.css('top', '25%');
    // $legend.css('line-height', '30px');
    $legend.addClass(options.legendClass);
    $legendOuter.addClass('legendOuter');
    $legendOuter.append($legend);

    if (options.chartSide === 'right') {
      // $element.prepend($legend);
      $element.prepend($legendOuter);
    } else {
      // $element.append($legend);
      $element.append($legendOuter);
    }

    this.item = {};

    // add the labels
    var labels = options.labels;
    for (var i = 0, l = labels.length; i < l; i++) {
      var $colorPart = $('<span></span>');
      $colorPart.css('width', 20);
      $colorPart.css('height', 20);
      $colorPart.css('background', options.colors[i]);
      $colorPart.css('top', '5px');
      $colorPart.css('float', 'left');
      var $label = $('<div class="label">'+
                        $colorPart.get(0).outerHTML+
                        '<span style="margin-left: 5px;">'+labels[i]+'</span>'+
                     '</div>');
      // $label.prepend($colorPart);
      $label.css('left', '5px');
      if (i > 0) {
        $label.css('margin-top', '10px');
      }
      $legend.append($label);

      this.item[options.colors[i].toLowerCase()] = {
        label: $label,
        colorPart: $colorPart
      };
    }
  };

  function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) {
      throw "Invalid color component";
    }
    return ((r << 16) | (g << 8) | b).toString(16);
  }

  // @class $.fn.piechart
  //
  // Apply the plugin to one or more jQuery objects.
  //
  // @param {object} [options] : settings for the pie chart
  $.fn.piechart = function(options) {
    // merge specified options into the defaults
    var settings = $.extend({}, $.fn.piechart.defaults, options);

    return this.each(function() {
      new PieChart(this, settings);
    });
  };


  // @namespace $.fn.piechart.colorSchemes
  // Preset color schemes to choose from.
  $.fn.piechart.colorSchemes = {
    // {array} BLUEBERRY :
    // {array} CAKE :
    // {array} CHERRY_TREE :
    // {array} EARTH :
    // {array} EASTER :
    // {array} FLOWER :
    // {array} HARVEST :
    // {array} LAKE_HOUSE :
    // {array} LAKE_SUNSET :
    // {array} RAINBOW :
    // {array} SUMMER :

    BLUEBERRY   : [ '#e3e3e3', '#aaa7ba', '#52719e', '#2e2e59', '#804070',
                    '#d6cbc0' ],
    CAKE        : [ '#774F38', '#E08E79', '#F1D4AF', '#ECE5CE', '#C5E0DC' ],
    CHERRY_TREE : [ '#45603B', '#6D8D4E', '#8B8D46', '#863528', '#AA6459',
                    '#DDBCB7', '#F8CD81', '#5C432D', '#725942' ],
    EARTH       : [ '#C9A664', '#B78723', '#A26500', '#636900', '#401F13' ],
    EASTER      : [ '#F7F7B1', '#BDDA5D', '#DAEFF1', '#D1C4DD', '#FFE4E5',
                    '#B3DBE3', '#E5F7B1', '#FFCACC', '#E8E2EE', '#C9E7F9' ],
    FLOWER      : [ '#d1e8b2', '#c790ba', '#9fd4c0', '#ba4e4d', '#73698c',
                    '#6fab9b'],
    HARVEST     : [ '#EFBC7A', '#E0842F', '#B7601D', '#B83815', '#8F310F',
                    '#B7A445', '#7C6522', '#4E2507'],
    LAKE_HOUSE  : [ '#DED0B6', '#93817F', '#B8CCE7', '#CAAB8F', '#D5BC9E',
                    '#67ABEC', '#60A0EA', '#A0CBF5', '#3D78D4', '#4D4A5F' ],
    LAKE_SUNSET : [ '#d4b9cc', '#8b90c7', '#3f3e61', '#402b42', '#e04c12',
                    '#f7da7b' ],
    RAINBOW     : [ 'red', 'orange', 'yellow', 'green', 'blue', 'violet' ],
    SUMMER      : [ '#018592', '#82D1E2', '#F7941C', '#FFC74E', '#937046',
                    '#C7B29F']

  };

  // @namespace $.fn.piechart.defaults
  // Default options for pie charts.
  $.fn.piechart.defaults = {

    borderColor   : '#fff',       // {string} borderColor : color of border, if any {@default "#fff"}
    borderWidth   : 0,            // {int} borderWidth : width of border, 0 if none {@default 0}
    chartClass    : '',           // {string} chartClass : css class to apply to the chart {@default ""}
    chartSide     : 'left',       // {string} chartSide : which side to put the chart on {@default left}
    colors        : $.fn.piechart.colorSchemes.EASTER,  // {array} colors : color of each division {@default $.fn.piechart.colorSchemes.EASTER}
    height        : 300,          // {int} height : height of the chart (not the entire div, just the actual chart) {@default 300}
    labels        : [ '', '' ],   // {array} labels : text labels for the divisions {@default [ "", ""]}
    legendClass   : '',           // {string} legendClass : css class to apply to the legend {@default  }
    percentages   : [ 75,         // {array} percentages : percentage of 100 of amount to fill {@default [75, 25]}
                      25 ],       // : can also be a running total -> [ 75, 100 ]
    showLegend    : false,        // {boolean} showLegend : enable/disable text labels {@default false}
    title         : '',           // {string} title : the title of the chart {@default ""}
    titleClass    : '',           // {string} titleClass : css class to apply to the title {@default ""}
    titleJustify  : 'left',       // {string} titleJustify : left, right, center {@default left}
  };

}(jQuery));