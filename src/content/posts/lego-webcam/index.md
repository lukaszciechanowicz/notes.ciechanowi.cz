---
title: A webcam made of LEGO. Because of course.
description: An old Creative USB webcam, an ESP32, a tiny servo, and an excellent excuse to play.
slug: a-webcam-made-of-lego
pubDate: 2026-10-18
tags: [LEGO, Electronics, Automation]
readingMinutes: 1
sketch: camera
---

What do you do when you want to close your laptop during a Zoom call but still need a webcam? Build your own out of LEGO, of course.

I put an old Creative USB webcam inside a LEGO build, added an ESP32 and a tiny servo, and gave it a moving cover. The board runs a small HTTP API over Wi-Fi. macOS Automator sends the requests, with keyboard shortcuts mapped to the custom buttons on my mouse. One click opens the cover. Another closes it.

Along the way, I learned how to write an API for the ESP32. Not bad for an excuse to play with LEGO.

Could I have just bought a regular webcam? Sure. But where’s the fun in that?

Does this make sense? No. Do I love it? Absolutely. LEGO, electronics, automation. I’m having a great time.

Thanks, [M5Stack](https://m5stack.com/), for making hardware hacks this simple.

<div class="photo-grid" aria-label="Four photographs of the LEGO webcam">
  <figure><a href="/images/lego-webcam/finished.jpg" target="_blank" rel="noopener"><img src="/images/lego-webcam/finished.jpg" width="1600" height="1200" alt="The LEGO webcam on the desk, with its M5Stack servo on the side and a blue minifigure on top."></a><figcaption>The finished contraption. Pilot included.</figcaption></figure>
  <figure><a href="/images/lego-webcam/front.jpg" target="_blank" rel="noopener"><img src="/images/lego-webcam/front.jpg" width="1600" height="1200" alt="Front view of the LEGO webcam on top of a monitor, with the lens exposed and the cover raised."></a><figcaption>Ready for a call.</figcaption></figure>
  <figure><a href="/images/lego-webcam/inside.jpg" target="_blank" rel="noopener"><img src="/images/lego-webcam/inside.jpg" width="1600" height="1200" loading="lazy" alt="The webcam with the top removed, revealing the old USB camera circuit board inside the LEGO housing."></a><figcaption>Old webcam, new home.</figcaption></figure>
  <figure><a href="/images/lego-webcam/mount.jpg" target="_blank" rel="noopener"><img src="/images/lego-webcam/mount.jpg" width="1600" height="1200" loading="lazy" alt="Rear view showing the LEGO bracket holding the camera on the monitor, the servo wiring and the USB cable."></a><figcaption>The mount is LEGO too. Naturally.</figcaption></figure>
</div>

You have to see it in action.

<iframe class="video-embed" width="560" height="315" src="https://www.youtube.com/embed/HcZjabvPD5c?si=D766QiOgYRvYQkzz" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
