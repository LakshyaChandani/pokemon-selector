// modules/imageLoader.js
export class ImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: "50px",
      threshold: 0.01,
      fadeIn: true,
      ...options,
    };

    this.observer = this.createObserver();
    this.preloadCache = new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  createObserver() {
    return new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
          }
        }),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );
  }

  observe(img) {
    if (!img?.dataset?.src) return;

    img.classList.add("image-loading");
    this.observer.observe(img);
  }

  observeAll(selector) {
    document.querySelectorAll(selector).forEach((img) => this.observe(img));
  }

  async loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    try {
      await this.preloadImage(src);

      img.src = src;
      img.classList.replace("image-loading", "image-loaded");

      if (this.options.fadeIn) {
        this.fadeIn(img);
      }

      delete img.dataset.src;
      this.observer.unobserve(img);
      this.options.onLoad?.(img);
    } catch (error) {
      img.classList.replace("image-loading", "image-error");
      this.observer.unobserve(img);
      this.options.onError?.(img, error);
    }
  }

  fadeIn(img) {
    img.style.opacity = "0";
    requestAnimationFrame(() => {
      img.style.transition = "opacity 0.3s ease-in-out";
      img.style.opacity = "1";
    });
  }

  // Preloading functionality
  preload(urls) {
    const urlArray = Array.isArray(urls) ? urls : [urls];

    urlArray.forEach((url) => {
      if (!this.preloadCache.has(url)) {
        this.preloadQueue.push(url);
      }
    });

    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  async processPreloadQueue() {
    if (!this.preloadQueue.length) {
      this.isPreloading = false;
      return;
    }

    this.isPreloading = true;
    const url = this.preloadQueue.shift();

    try {
      await this.preloadImage(url);
      this.preloadCache.add(url);
    } catch (error) {
      console.error(`Failed to preload ${url}:`, error);
    }

    this.processPreloadQueue();
  }

  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      img.src = url;
    });
  }

  disconnect() {
    this.observer?.disconnect();
  }
}

// Export singleton instance for convenience
export const imageLoader = new ImageLoader();

// Export class for custom instances
export { ImageLoader as ImageLoaderClass };

// Backward compatibility
export class ImagePreloader {
  constructor() {
    console.warn(
      "ImagePreloader is deprecated. Use imageLoader.preload() instead"
    );
    this.loader = imageLoader;
  }

  add(urls) {
    this.loader.preload(urls);
  }
}
