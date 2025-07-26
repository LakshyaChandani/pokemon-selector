// Number counting animation utility
export class NumberAnimation {
  constructor(element, endValue, duration = 1000, options = {}) {
    this.element = element;
    this.endValue = parseInt(endValue);
    this.duration = duration;
    this.startValue = options.startValue || 0;
    this.prefix = options.prefix || "";
    this.suffix = options.suffix || "";
    this.easing = options.easing || this.easeInOutQuad;
    this.onComplete = options.onComplete || null;
    this.decimals = options.decimals || 0;
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  animate() {
    const startTime = performance.now();

    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);

      const easedProgress = this.easing(progress);
      const currentValue = Math.floor(
        this.startValue + (this.endValue - this.startValue) * easedProgress
      );

      this.element.textContent =
        this.prefix + currentValue.toLocaleString() + this.suffix;

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        this.element.textContent =
          this.prefix + this.endValue.toLocaleString() + this.suffix;
        if (this.onComplete) this.onComplete();
      }
    };

    requestAnimationFrame(updateNumber);
  }
}

// Helper function for easy use
export function animateNumber(selector, endValue, options = {}) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!element) return;

  const animation = new NumberAnimation(
    element,
    endValue,
    options.duration || 1000,
    options
  );
  animation.animate();
}
