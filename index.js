window.onload = () => {

  const SETTINGS = {
    line: { color: '#EEEEEE', width: 1 },
    canvas: { width: 600, height: 400 }
  };
  const imageCanvas = document.getElementById('image-canvas');
  const bufferCanvas = document.getElementById('buffer-canvas');
  const pixelSizeInput = document.getElementById('size-input');
  const pixelPaddingInput = document.getElementById('padding-input');
  const context = imageCanvas.getContext('2d');
  const bufferContext = bufferCanvas.getContext('2d');
  const p = { x1: 0, y1: 0, x2: 0, y2: 0 };
  const tweenFactor = 5;
  const image = new Image();
  const pixels = [];
  let padding = 0;
  let imageData = null;
  let imageIsLoaded = false;
  let cutWidth = 0;
  let cutHeight = 0;
  let isMouseDown = false;

  image.src = './images/comix.png';

  imageCanvas.style.border = 'solid 5px #4488FF';
  bufferCanvas.style.border = 'solid 5px #AAAAAA';
  bufferCanvas.style.background = '#EEEEEE';

  imageCanvas.width = SETTINGS.canvas.width / 2;
  imageCanvas.height = SETTINGS.canvas.height;
  bufferCanvas.width = SETTINGS.canvas.width / 2;
  bufferCanvas.height = SETTINGS.canvas.height;
  context.strokeStyle = SETTINGS.line.color;
  context.lineWidth = SETTINGS.line.width;

  pixelSizeInput.defaultValue = 1;
  pixelPaddingInput.defaultValue = 0;

  const random = (min, max) => Math.random() * (max - min) + min;

  function Pixel(config = {}) {
    this.color = config.color || '#EEEEEE';
    this.x = config.x || random(imageCanvas.width, 0);
    this.y = config.y || random(imageCanvas.height, 0);
    this.size = config.size || 1;
    this.target = {
      x: 0,
      y: 0,
    };
    this.speed = random(10, 50);
  }

  // a basic chasing algorithm
  Pixel.prototype.chase = function () {
    if (this.x < this.target.x) {
      this.x += this.speed;
    }
    if (this.x > this.target.x) {
      this.x -= this.speed;
    }
    if (this.y < this.target.y) {
      this.y += this.speed;
    }
    if (this.y > this.target.y) {
      this.y -= this.speed;
    }
    if (Math.abs(this.x - this.target.x) < this.speed) {
      this.x = this.target.x;
    }
    if (Math.abs(this.y - this.target.y) < this.speed) {
      this.y = this.target.y;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.speed = distance / tweenFactor;
  };

  const rgbToHex = (rgb) => {
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  };

  const getHex = (r, g, b) => rgbToHex(r) + rgbToHex(g) + rgbToHex(b);

  const setLocations = function () {
    const size = parseInt(pixelSizeInput.value);
    const startX = (bufferCanvas.width - ((size + padding) * cutWidth)) / 2;
    const startY = (bufferCanvas.height - ((size + padding) * cutHeight)) / 2;

    let px = 0;
    let py = 0;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];

      px++;
      if (px % cutWidth === 0 && px !== 0) {
        px = 0;
        py += 1;
      }

      pixel.target.x = startX + px * (pixel.size + padding);
      pixel.target.y = startY + py * (pixel.size + padding);
    }
  };

  imageCanvas.onmousedown = function (e) {
    const rect = imageCanvas.getBoundingClientRect();

    if (!isMouseDown) {
      p.x1 = e.clientX - rect.x;
      p.y1 = e.clientY - rect.y;
      isMouseDown = true;
    }
  };

  imageCanvas.onmouseup = () => {
    const width = p.x2 - p.x1;
    const height = p.y2 - p.y1;
    cutWidth = width;
    cutHeight = height;
    const size = parseInt(pixelSizeInput.value);
    padding = parseInt(pixelPaddingInput.value);

    imageData = context.getImageData(p.x1, p.y1, width, height);
    isMouseDown = false;
    pixels.length = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const color = getHex(r, g, b);
      const pixel = new Pixel({ color, size });
      pixels.push(pixel);
    }

    setLocations();
  };

  imageCanvas.onmousemove = e => {
    const rect = imageCanvas.getBoundingClientRect();

    p.x2 = e.clientX - rect.x;
    p.y2 = e.clientY - rect.y;
  };

  const render = () => {
    context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    bufferContext.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    context.stroke();
    if (imageIsLoaded) {
      context.drawImage(image, imageCanvas.width / 2 - image.width / 2, imageCanvas.height / 2 - image.height / 2);

      if (pixels.length && !isMouseDown) {
        for (let i = 0; i < pixels.length; i++) {
          const pixel = pixels[i];

          pixel.chase();
          bufferContext.fillStyle = '#' + pixel.color;
          bufferContext.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
        }
      }
    }
    if (isMouseDown) {
      context.strokeRect(p.x1, p.y1, p.x2 - p.x1, p.y2 - p.y1);
    }
  };

  const run = () => {
    render();
    requestAnimationFrame(run);
  };

  image.onload = () => {
    imageIsLoaded = true;
    if (image.width > 400) {
      imageCanvas.width = image.width;
      imageCanvas.height = image.height;
      bufferCanvas.width = imageCanvas.width;
      bufferCanvas.height = imageCanvas.height;
    }
    run();
  };
};