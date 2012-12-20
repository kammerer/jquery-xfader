(function($) {
  function XFader(target, options) {
    var default_options = {
      auto: true,
      loop: true,
      timeout: 5000,
      next_selector: "#fader-next",
      prev_selector: "#fader-prev",
      controls_selector: "#fader-controls",
      beforeSlide: null,
      slide: null
    };

    this.options = $.extend({}, default_options, options);
    this.animating = false;
    this.$slides = $(target).find("li");
    this.$controls = $(this.options.controls_selector).find("li");
    this.$prev = $(this.options.prev_selector);
    this.$next = $(this.options.next_selector);
  }

  XFader.prototype.init = function() {
    //this.$slides.parent().css({ 'position': 'relative' });
    this.$slides.css({ 'position': 'absolute', 'top': 0, 'bottom': 0 });
    this.$slides.first().nextAll().hide();
    this.$slides.first().addClass('current');

    if (! this.options.loop) {
      this.$prev.hide();
    }

    this.bind_event_handlers();
    this.update_numeric_controls();

    var fader = this;

    if (this.options.auto) {
      var dir = "next";
      var interval = setInterval(function() {
        if (! fader.options.auto) {
          clearInterval(interval);
          return;
        }

        if (dir == "next") {
          if (fader.current_slide().get(0) != fader.last_slide().get(0)) {
            fader.next();
          }
          else {
            dir = "prev";
            fader.prev();
          }
        }
        else if (dir == "prev") {
          if (fader.current_slide().get(0) != fader.first_slide().get(0)) {
            fader.prev();
          }
          else {
            dir = "next";
            fader.next();
          }
        }
      }, fader.options.timeout);
    }
  };

  XFader.prototype.bind_event_handlers = function() {
    var fader = this;

    this.$controls.find('a').each(function(idx) {
      $(this).click(function(event) {
        fader.options.auto = false;
        event.preventDefault();
        if (! fader.animating)
          fader.goto_slide(idx);
      });
    });

    this.$next.click(function(event) {
      fader.options.auto = false;
      event.preventDefault();
      if (! fader.animating)
        fader.next();
    });

    this.$prev.click(function(event) {
      fader.options.auto = false;
      event.preventDefault();
      if (! fader.animating)
        fader.prev();
    });
  };

  XFader.prototype.current_slide = function() {
    return this.$slides.filter('.current');
  };

  XFader.prototype.first_slide = function() {
    return this.$slides.first();
  };

  XFader.prototype.last_slide = function() {
    return this.$slides.last();
  };

  XFader.prototype.next_slide = function() {
    var $next_slide = this.current_slide().next();
    if (this.options.loop && $next_slide.length == 0) {
      $next_slide = this.first_slide();
    }

    return $next_slide;
  };

  XFader.prototype.prev_slide = function() {
    var $prev_slide = this.current_slide().prev();
    if (this.options.loop && $prev_slide.length == 0) {
      $prev_slide = this.last_slide();
    }

    return $prev_slide;
  };

  XFader.prototype.next = function() {
    var $current_slide = this.current_slide();
    var $next_slide = this.next_slide();

    var fader = this;

    if ($next_slide.length > 0) {
      this.animating = true;
      this.call_before_slide_handler($current_slide.get(0));

      $current_slide.animate({ opacity: 0 }, 500);
      $next_slide.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
        fader.$prev.show();
        $current_slide.hide().removeClass('current');
        $next_slide.addClass('current');

        fader.update_numeric_controls();
        fader.animating = false;
        fader.call_slide_handler($next_slide.get(0));
      });
    }
    
    if (! this.options.loop && $current_slide.nextAll().length < 2) {
      fader.$next.hide();
    }
  };

  XFader.prototype.update_numeric_controls = function() {
    $(this.$controls.removeClass('current')[this.current_slide().prevAll().length]).addClass('current');
  };

  XFader.prototype.prev = function() {
    var $current_slide = this.current_slide();
    var $prev_slide = this.prev_slide();

    var fader = this;

    if ($prev_slide.length > 0) {
      this.animating = true;
      this.call_before_slide_handler($current_slide.get(0));

      $current_slide.animate({ opacity: 0 }, 500);
      $prev_slide.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
        fader.$next.show();
        $current_slide.hide().removeClass('current');
        $prev_slide.addClass('current');

        fader.update_numeric_controls();
        fader.animating = false;
        fader.call_slide_handler($prev_slide.get(0));
      });
    }

    if (! this.options.loop && $current_slide.prevAll().length < 2) {
      fader.$prev.hide();
    }
  };

  XFader.prototype.goto_slide = function(idx) {
    var $current_slide = this.current_slide();
    var $target_slide = $(this.$slides.get(idx));

    if ($current_slide.get(0) == $target_slide.get(0))
      return;

    var fader = this;

    this.animating = true;
    this.call_before_slide_handler($current_slide.get(0));

    $current_slide.animate({ opacity: 0 }, 500);
    $target_slide.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
      fader.$slides.filter('.current').removeClass('current').hide();
      $target_slide.addClass('current');

      if ($target_slide.nextAll().length == 0) {
        fader.$next.hide();
      }
      else {
        fader.$next.show();
      }

      if ($target_slide.prevAll().length == 0) {
        fader.$prev.hide();
      }
      else {
        fader.$prev.show();
      }

      fader.update_numeric_controls();
      fader.animating = false;
      fader.call_slide_handler($target_slide.get(0));
    });
  };

  XFader.prototype.call_before_slide_handler = function(slide) {
    if (this.options.beforeSlide) {
      this.options.beforeSlide.call(slide, this.$slides.index(slide));
    }
  };

  XFader.prototype.call_slide_handler = function(slide) {
    if (this.options.slide) {
      this.options.slide.call(slide, this.$slides.index(slide));
    }
  };

  $.fn.xfader = function() {
    var options = arguments.length > 0 ? arguments[0] : {};

    $(this).each(function() {
      var fader = new XFader(this, options);
      fader.init();
    });

    return $(this);
  };

})(jQuery);
