const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const nodes = document.querySelectorAll("[data-reveal]");
  nodes.forEach((node) => node.classList.add("will-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node) => observer.observe(node));
}

const clip = document.querySelector(".portrait-frame video");
if (clip && !reduceMotion) {
  clip.muted = true;
  clip.defaultMuted = true;
  clip.pause();

  let lastY = window.scrollY;
  let direction = 0;
  let inView = false;
  let running = false;
  let lastTick = 0;
  let idleTimer = 0;

  const seek = (delta) => {
    const dur = clip.duration;
    if (!dur || Number.isNaN(dur)) return;
    let next = clip.currentTime + delta;
    if (next < 0) next = 0;
    if (next > dur - 0.04) next = dur - 0.04;
    if (next !== clip.currentTime) clip.currentTime = next;
  };

  const tick = (now) => {
    if (!direction || !inView) {
      running = false;
      return;
    }
    const dt = Math.min(0.05, (now - lastTick) / 1000 || 0);
    lastTick = now;
    seek(direction * dt);
    requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTick = performance.now();
    requestAnimationFrame(tick);
  };

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y !== lastY) direction = y > lastY ? 1 : -1;
      lastY = y;
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        direction = 0;
      }, 140);
      start();
    },
    { passive: true },
  );

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (!inView) direction = 0;
      },
      { threshold: 0.2 },
    );
    videoObserver.observe(clip);
  } else {
    inView = true;
  }
}
