import { useEffect } from 'react';

/**
 * Stabilizes mobile layout: sync visual viewport height to --vvh
 * and reduce jank from URL bar / keyboard resize.
 */
export function ViewportStability() {
  useEffect(() => {
    const root = document.documentElement;

    const setVvh = () => {
      const vv = window.visualViewport;
      const h = vv?.height ?? window.innerHeight;
      // Round to reduce sub-pixel thrash
      root.style.setProperty('--vvh', `${Math.round(h)}px`);
      if (vv) {
        root.style.setProperty('--vv-offset', `${Math.round(vv.offsetTop)}px`);
      }
    };

    setVvh();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', setVvh);
    vv?.addEventListener('scroll', setVvh);
    window.addEventListener('resize', setVvh);
    window.addEventListener('orientationchange', setVvh);

    return () => {
      vv?.removeEventListener('resize', setVvh);
      vv?.removeEventListener('scroll', setVvh);
      window.removeEventListener('resize', setVvh);
      window.removeEventListener('orientationchange', setVvh);
    };
  }, []);

  return null;
}

export default ViewportStability;
