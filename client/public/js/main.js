(function ($) {

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.scrollup').fadeIn();
    } else {
      $('.scrollup').fadeOut();
    }
  });
  $('.scrollup').click(function () {
    $("html, body").animate({
      scrollTop: 0
    }, 1000);
    return false;
  });

  // local scroll
  jQuery('.navbar').localScroll({
    hash: true,
    offset: {
      top: 0
    },
    duration: 800,
    easing: 'easeInOutExpo'
  });


  // portfolio
  if ($('.isotopeWrapper').length) {

    var $container = $('.isotopeWrapper');
    var $resize = $('.isotopeWrapper').attr('id');
    // initialize isotope

    $container.isotope({
      itemSelector: '.isotopeItem',
      resizable: false, // disable normal resizing
      masonry: {
        columnWidth: $container.width() / $resize
      }

    });

    $('#filter a').click(function () {

      $('#filter a').removeClass('current');
      $(this).addClass('current');
      var selector = $(this).attr('data-filter');
      $container.isotope({
        filter: selector,
        animationOptions: {
          duration: 1000,
          easing: 'easeOutQuart',
          queue: false
        }
      });
      return false;
    });


    $(window).smartresize(function () {
      $container.isotope({
        // update columnWidth to a percentage of container width
        masonry: {
          columnWidth: $container.width() / $resize
        }
      });
    });
  }

  // fancybox
  jQuery(".fancybox").fancybox();

  if (Modernizr.mq("screen and (max-width:1024px)")) {
    jQuery("body").toggleClass("body");

  } else {
    var s = skrollr.init({
      mobileDeceleration: 1,
      edgeStrategy: 'set',
      forceHeight: true,
      smoothScrolling: true,
      smoothScrollingDuration: 300,
      easing: {
        WTF: Math.random,
        inverted: function (p) {
          return 1 - p;
        }
      }
    });
  }

  //scroll menu
  jQuery('.appear').appear();
  jQuery(".appear").on("appear", function (data) {
    var id = $(this).attr("id");
    jQuery('.nav li').removeClass('active');
    jQuery(".nav a[href='#" + id + "']").parent().addClass("active");
  });

  //parallax
  var isMobile = false;

  if (Modernizr.mq('only all and (max-width: 1024px)')) {
    isMobile = true;
  }

  if (isMobile == false && ($('#parallax1').length || isMobile == false && $('#parallax2').length || isMobile == false && $('#testimonials').length)) {


    $(window).stellar({
      responsive: true,
      scrollProperty: 'scroll',
      parallaxElements: false,
      horizontalScrolling: false,
      horizontalOffset: 0,
      verticalOffset: 0
    });

  }


  // Liquid Buttons

  // Vars
  var pointsA = [],
    pointsB = [],
    $canvas = null,
    canvas = null,
    context = null,
    vars = null,
    points = 8,
    viscosity = 20,
    mouseDist = 70,
    damping = 0.05,
    showIndicators = false,
    mouseX = 0,
    mouseY = 0,
    relMouseX = 0,
    relMouseY = 0,
    mouseLastX = 0,
    mouseLastY = 0,
    mouseDirectionX = 0,
    mouseDirectionY = 0,
    mouseSpeedX = 0,
    mouseSpeedY = 0;

  /**
   * Get mouse direction
   */
  function mouseDirection(e) {
    if (mouseX < e.pageX)
      mouseDirectionX = 1;
    else if (mouseX > e.pageX)
      mouseDirectionX = -1;
    else
      mouseDirectionX = 0;

    if (mouseY < e.pageY)
      mouseDirectionY = 1;
    else if (mouseY > e.pageY)
      mouseDirectionY = -1;
    else
      mouseDirectionY = 0;

    mouseX = e.pageX;
    mouseY = e.pageY;

    relMouseX = (mouseX - $canvas.offset().left);
    relMouseY = (mouseY - $canvas.offset().top);
  }
  // $(document).on('mousemove', mouseDirection);

  /**
   * Get mouse speed
   */
  function mouseSpeed() {
    mouseSpeedX = mouseX - mouseLastX;
    mouseSpeedY = mouseY - mouseLastY;

    mouseLastX = mouseX;
    mouseLastY = mouseY;

    setTimeout(mouseSpeed, 50);
  }
  mouseSpeed();

  /**
   * Init button
   */
  function initButton() {
    // Get button
    var button = $('.btn-liquid');
    var buttonWidth = button.width();
    var buttonHeight = button.height();

    // Create canvas
    $canvas = $('<canvas></canvas>');
    button.append($canvas);

    canvas = $canvas.get(0);
    canvas.width = buttonWidth + 100;
    canvas.height = buttonHeight + 100;
    context = canvas.getContext('2d');

    // Add points

    var x = buttonHeight / 2;
    for (var j = 1; j < points; j++) {
      addPoints((x + ((buttonWidth - buttonHeight) / points) * j), 0);
    }
    addPoints(buttonWidth - buttonHeight / 5, 0);
    addPoints(buttonWidth + buttonHeight / 10, buttonHeight / 2);
    addPoints(buttonWidth - buttonHeight / 5, buttonHeight);
    for (var j = points - 1; j > 0; j--) {
      addPoints((x + ((buttonWidth - buttonHeight) / points) * j), buttonHeight);
    }
    addPoints(buttonHeight / 5, buttonHeight);

    addPoints(-buttonHeight / 10, buttonHeight / 2);
    addPoints(buttonHeight / 5, 0);
    // addPoints(x, 0);
    // addPoints(0, buttonHeight/2);

    // addPoints(0, buttonHeight/2);
    // addPoints(buttonHeight/4, 0);

    // Start render
    renderCanvas();
  }

  /**
   * Add points
   */
  function addPoints(x, y) {
    pointsA.push(new Point(x, y, 1));
    pointsB.push(new Point(x, y, 2));
  }

  /**
   * Point
   */
  function Point(x, y, level) {
    this.x = this.ix = 50 + x;
    this.y = this.iy = 50 + y;
    this.vx = 0;
    this.vy = 0;
    this.cx1 = 0;
    this.cy1 = 0;
    this.cx2 = 0;
    this.cy2 = 0;
    this.level = level;
  }

  Point.prototype.move = function () {
    this.vx += (this.ix - this.x) / (viscosity * this.level);
    this.vy += (this.iy - this.y) / (viscosity * this.level);

    var dx = this.ix - relMouseX,
      dy = this.iy - relMouseY;
    var relDist = (1 - Math.sqrt((dx * dx) + (dy * dy)) / mouseDist);

    // Move x
    if ((mouseDirectionX > 0 && relMouseX > this.x) || (mouseDirectionX < 0 && relMouseX < this.x)) {
      if (relDist > 0 && relDist < 1) {
        this.vx = (mouseSpeedX / 4) * relDist;
      }
    }
    this.vx *= (1 - damping);
    this.x += this.vx;

    // Move y
    if ((mouseDirectionY > 0 && relMouseY > this.y) || (mouseDirectionY < 0 && relMouseY < this.y)) {
      if (relDist > 0 && relDist < 1) {
        this.vy = (mouseSpeedY / 4) * relDist;
      }
    }
    this.vy *= (1 - damping);
    this.y += this.vy;
  };


  /**
   * Render canvas
   */
  function renderCanvas() {
    // rAF
    rafID = requestAnimationFrame(renderCanvas);

    // Clear scene
    context.clearRect(0, 0, $canvas.width(), $canvas.height());
    context.fillStyle = '#fff';
    context.fillRect(0, 0, $canvas.width(), $canvas.height());

    // Move points
    for (var i = 0; i <= pointsA.length - 1; i++) {
      pointsA[i].move();
      pointsB[i].move();
    }

    // Create dynamic gradient
    var gradientX = Math.min(Math.max(mouseX - $canvas.offset().left, 0), $canvas.width());
    var gradientY = Math.min(Math.max(mouseY - $canvas.offset().top, 0), $canvas.height());
    var distance = Math.sqrt(Math.pow(gradientX - $canvas.width() / 2, 2) + Math.pow(gradientY - $canvas.height() / 2, 2)) / Math.sqrt(Math.pow($canvas.width() / 2, 2) + Math.pow($canvas.height() / 2, 2));

    var gradient = context.createRadialGradient(gradientX, gradientY, 300 + (300 * distance), gradientX, gradientY, 0);
    gradient.addColorStop(0, '#E406D6');
    gradient.addColorStop(1, '#44BCDD');

    // Draw shapes
    var groups = [pointsA, pointsB]

    for (var j = 0; j <= 1; j++) {
      var points = groups[j];

      if (j == 0) {
        // Background style
        context.fillStyle = '#4475DD';
      } else {
        // Foreground style
        context.fillStyle = gradient;
      }

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var nextP = points[i + 1];
        var val = 30 * 0.552284749831;

        if (nextP != undefined) {
          p.cx1 = (p.x + nextP.x) / 2;
          p.cy1 = (p.y + nextP.y) / 2;
          p.cx2 = (p.x + nextP.x) / 2;
          p.cy2 = (p.y + nextP.y) / 2;

          context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
        } else {
          nextP = points[0];
          p.cx1 = (p.x + nextP.x) / 2;
          p.cy1 = (p.y + nextP.y) / 2;

          context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
        }
      }
      context.fill();
    }

    if (showIndicators) {
      // Draw points
      context.fillStyle = '#000';
      context.beginPath();
      for (var i = 0; i < pointsA.length; i++) {
        var p = pointsA[i];

        context.rect(p.x - 1, p.y - 1, 2, 2);
      }
      context.fill();

      // Draw controls
      context.fillStyle = '#f00';
      context.beginPath();
      for (var i = 0; i < pointsA.length; i++) {
        var p = pointsA[i];

        context.rect(p.cx1 - 1, p.cy1 - 1, 2, 2);
        context.rect(p.cx2 - 1, p.cy2 - 1, 2, 2);
      }
      context.fill();
    }
  }

  // Init
  // initButton();

})(jQuery);
