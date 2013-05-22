/*
 * superslides
 * https://github.com/nicinabox/superslides
 *
 * Copyright (c) 2013 Nic Aitch
 * Licensed under the MIT license.
 */

(function(window, $) {

  var Superslides, plugin = 'superslides';

  Superslides = function(el, options) {
    this.options = $.extend({
      play: false,
      animation_speed: 600,
      animation_easing: 'swing',
      animation: 'slide',
      inherit_width_from: window,
      inherit_height_from: window,
      pagination: true,
      hashchange: false,
      scrollable: true,
      elements: {
        preserve: '.preserve',
        nav: '.slides-navigation',
        container: '.slides-container',
        pagination: '.slides-pagination'
      }
    }, options);

    var that       = this,
        $control   = $('<div>', { "class": 'slides-control' }),
        multiplier = 1;

    this.$el        = $(el);
    this.$container = this.$el.find(this.options.elements.container);

    // Bind this reference
    this.animation     = this.fx[this.options.animation].bind(this);
    this.image.scale   = this.image.scale.bind(this);
    this.image.center  = this.image.center.bind(this);
    this.image.centerX = this.image.centerX.bind(this);
    this.image.centerY = this.image.centerY.bind(this);

    // Private Methods
    var initialize = function() {
      multiplier = that.findMultiplier();
      that.findPositions();

      that.$control = that.$container.wrap($control).parent('.slides-control');

      that.width  = that.findWidth();
      that.height = that.findHeight();

      setupCss();
      setupChildren();
      setupContainers();
      setupImages();

      $(document).on('click', that.options.elements.nav + " a", function(e) {
        e.preventDefault();

        that.stop();
        if ($(this).hasClass('next')) {
          that.animate('next');
        } else {
          that.animate('prev');
        }
      });

      $(window).on('resize', function() {
        setTimeout(function() {
          var $children = that.$container.children();

          that.width  = that.findWidth();
          that.height = that.findHeight();

          $children.css({
            width: that.width,
            left: that.width
          });

          setupContainers();
          setupImages();
        }, 200);
      });

      that.start();
      return that;
    };

    var setupCss = function() {
      $('body').css({
        margin: 0
      });

      that.$el.css({
        position: 'relative',
        overflowX: 'hidden',
        width: '100%'
      });

      that.$control.css({
        position: 'relative',
        transform: 'translate3d(0)',
        height: '100%'
      });

      that.$container.css({
        display: 'none',
        margin: '0',
        padding: '0',
        listStyle: 'none',
        position: 'relative',
        height: '100%'
      });

      that.$container.find('img').not(that.options.elements.preserve).css({
        "-webkit-backface-visibility": 'hidden',
        "-ms-interpolation-mode": 'bicubic',
        "position": 'absolute',
        "left": '0',
        "top": '0',
        "z-index": '-1'
      }).removeAttr('width').removeAttr('height');
    };

    var setupChildren = function() {
      var $children = that.$container.children();

      if ($children.is('img')) {
        $children.wrap('<div>');
        $children = that.$container.children();
      }

      $children.css({
        position: 'absolute',
        overflow: 'hidden',
        display: 'none',
        height: '100%',
        width: that.width,
        left: that.width * 2,
        top: 0,
        zIndex: 0
      });
    };

    var setupImages = function() {
      var $images = that.$container.find('img').not(that.options.elements.preserve);
      $images.each(function() {
        that.image.scale(this);
        that.image.center(this);
      });
    };

    var setupContainers = function() {
      $('body').css({
        margin: 0
      });

      that.$el.css({
        height: that.height
      });

      that.$control.css({
        width: that.width * multiplier,
        left: -that.width
      });
    };

    return initialize();
  };

  Superslides.prototype = {
    mobile: (/mobile/i).test(navigator.userAgent),
    findWidth: function() {
      return $(this.options.inherit_width_from).width();
    },
    findHeight: function() {
      return $(this.options.inherit_width_from).height();
    },

    findMultiplier: function() {
      return this.size() === 1 ? 1 : 3;
    },

    upcomingSlide: function(direction) {
      if ((/next/).test(direction)) {
        return this.nextInDom();

      } else if ((/prev/).test(direction)) {
        return this.prevInDom();

      } else if ((/\d/).test(direction)) {
        return direction;

      } else {
        return false;
      }
    },

    findPositions: function(current, thisRef) {
      thisRef = thisRef || this;

      if (current === undefined) {
        current = -1;
      }

      thisRef.current = current;
      thisRef.next    = thisRef.nextInDom();
      thisRef.prev    = thisRef.prevInDom();
    },

    nextInDom: function() {
      var index = this.current + 1;

      if (index === this.size()) {
        index = 0;
      }

      return index;
    },

    prevInDom: function() {
      var index = this.current - 1;

      if (index < 0) {
        index = this.size() - 1;
      }

      return index;
    },

    size: function() {
      return this.$container.children().length;
    },

    destroy: function() {
      return this.$el.removeData();
    },

    update: function() {
      this.findPositions(this.current);
      this.$el.trigger('updated.slides');
    },

    stop: function() {
      clearInterval(this.play_id);
      delete this.play_id;

      this.$el.trigger('stopped.slides');
    },

    start: function() {
      var that = this;

      this.animate();

      if (this.options.play) {
        if (this.play_id) {
          this.stop();
        }

        this.play_id = setInterval(function() {
          that.animate();
        }, this.options.play);
      }

      this.$el.trigger('started.slides');
    },

    animate: function(direction, userCallback) {
      var that = this,
          orientation = {};

      if (this.animating) {
        return;
      }

      this.animating = true;

      if (!direction) {
        direction = 'next';
      }

      orientation.upcoming_slide = this.upcomingSlide(direction);

      if (orientation.upcoming_slide >= this.size()) {
        return;
      }

      orientation.outgoing_slide    = this.current;
      orientation.upcoming_position = this.width * 2;
      orientation.offset            = -orientation.upcoming_position;

      if (direction === 'prev' || direction < orientation.outgoing_slide) {
        orientation.upcoming_position = 0;
        orientation.offset            = 0;
      }

      this.animation(orientation, function() {
        that.findPositions(orientation.upcoming_slide, that);

        if (typeof userCallback === 'function') {
          userCallback();
        }

        that.animating = false;

        if (that.init) {
          that.$el.trigger('animated.slides');
        } else {
          that.init = true;
          that.$container.css({
            display: 'block'
          });
        }
      });
    }
  };

  Superslides.prototype.image = {
    centerY: function(image) {
      var $img = $(image),
          scale_height = this.width / $img.data('aspect-ratio');

      if (scale_height >= this.height) {
        $img.css({
          top: -(scale_height - this.height) / 2
        });
      } else {
        $img.css({
          top: 0
        });
      }

    },
    centerX: function(image) {
      var $img = $(image),
          scale_width = this.height * $img.data('aspect-ratio');

      if (scale_width >= this.width) {
        $img.css({
          left: -(scale_width - this.width) / 2
        });
      } else {
        $img.css({
          left: 0
        });
      }
    },
    center: function(image) {
      this.image.centerX(image);
      this.image.centerY(image);
    },
    scale: function(image) {
      var aspect_ratio = image.width / image.height,
          container_aspect_ratio = this.width / this.height,
          $img = $(image);

      $img.data('aspect-ratio', aspect_ratio);

      if (container_aspect_ratio >= aspect_ratio) {
        $img.css({
          height: 'auto',
          width: '100%'
        });
      } else {
        $img.css({
          height: '100%',
          width: 'auto'
        });
      }
    }
  };

  Superslides.prototype.fx = {
    slide: function(orientation, complete) {
      var that      = this,
          $children = that.$container.children(),
          $target   = $children.eq(orientation.upcoming_slide);

      $target.css({
        left: orientation.upcoming_position,
        display: 'block'
      });

      that.$control.animate({
        left: orientation.offset
      },
      that.options.animation_speed,
      that.options.animation_easing,
      function() {
        if (that.size() > 1) {
          that.$control.css({
            left: -that.width
          });

          $children.eq(orientation.upcoming_slide).css({
            left: that.width,
            zIndex: 2
          });

          if (orientation.outgoing_slide >= 0) {
            $children.eq(orientation.outgoing_slide).css({
              left: that.width,
              display: 'none',
              zIndex: 0
            });
          }
        }

        complete();
      });
    },
    fade: function(orientation, complete) {
      var that = this,
          $children = that.$container.children(),
          $outgoing = $children.eq(orientation.outgoing_slide),
          $target = $children.eq(orientation.upcoming_slide);

      $target.css({
        left: this.width,
        opacity: 1,
        display: 'block'
      });

      if (orientation.outgoing_slide >= 0) {
        $outgoing.animate({
          opacity: 0
        },
        that.options.animation_speed,
        that.options.animation_easing,
        function() {
          if (that.size() > 1) {
            $children.eq(orientation.upcoming_slide).css({
              zIndex: 2
            });

            if (orientation.outgoing_slide >= 0) {
              $children.eq(orientation.outgoing_slide).css({
                opacity: 1,
                display: 'none',
                zIndex: 0
              });
            }
          }

          complete();
        });
      } else {
        $target.css({
          zIndex: 2
        });
        complete();
      }
    }
  };

  // jQuery plugin definition
  $.fn[plugin] = function (options) {
    return this.each(function() {
      if (!$.data(this, plugin)) {
        $.data(this, plugin, new Superslides(this, options));
        $(this).trigger('init.slides');
      }
    });
  };

  // Prototype's .bind method
  if (!Function.prototype.bind) { // check if native implementation available
    Function.prototype.bind = function(){
      var fn = this, args = Array.prototype.slice.call(arguments),
          object = args.shift();
      return function(){
        return fn.apply(object,
          args.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }


})(this, jQuery);