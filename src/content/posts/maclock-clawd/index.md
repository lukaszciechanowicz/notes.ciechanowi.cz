---
title: "Meet Maclock Clawd: a tiny desk companion for my coding agents"
description: "Maclock Clawd: an open-source desk companion that reacts to Claude Code, Codex and OMP hooks—thinking, waiting, and celebrating from a tiny Raspberry Pi screen."
slug: maclock-clawd
pubDate: 2026-10-30
tags: [Raspberry Pi, Automation, AI, Open Source]
readingMinutes: 6
sketch: maclock
---

## TL;DR

- **It's open source:** [get the code and build your own](https://github.com/lukaszciechanowicz/maclock-clawd).
- **It has a cool gallery:** [browse all 64 animated reactions](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md).
- **There's a video explaining it all:** [watch the real display in action](https://www.youtube.com/watch?v=3HgPzPIy_u0).
- **It reacts to hooks from my AI agents:** Claude Code, Codex and OMP can make Maclock Clawd think, wait, react to errors and celebrate.

Meet Maclock Clawd, my tiny desk companion.

I built him around a Raspberry Pi Zero W and a 2.8-inch Waveshare DPI display, tucked inside a [Maclock enclosure](https://www.maclock.shop/en). He can sleep, wave hello, show some love, float in a pool, work at a computer, take a coffee break, listen to music… and occasionally run away when Big Boss calls.

<figure class="result-figure">
  <a href="/images/maclock-clawd/desk-companion.jpg" target="_blank" rel="noopener"><img src="/images/maclock-clawd/desk-companion.jpg" width="1600" height="1200" alt="Maclock Clawd on my desk beside a keyboard and coffee mug, sleeping beneath the calculator-style clock."></a>
  <figcaption>The real desk companion, taking a nap between requests.</figcaption>
</figure>

But my favourite part is not the clock or even the animations. **Maclock Clawd reacts to what my coding agents are doing.**

When work begins, he thinks. When an assistant needs input, he waits. When a response finishes, he can dance, wave, or take a well-earned pool break. A little activity indicator, with considerably more personality than a spinner in a terminal.

**Maclock Clawd is an open-source desk-companion project.** The source code, hardware details, setup instructions and assistant-hook examples are on GitHub:

**[github.com/lukaszciechanowicz/maclock-clawd](https://github.com/lukaszciechanowicz/maclock-clawd)**

## Coding-agent hooks, not another chatbot

Maclock Clawd connects to **Claude Code, Codex and OMP (Oh My Pi)** through optional hooks. The assistant runs on my computer; the Raspberry Pi receives small HTTP events and turns them into animations. There is no language model running inside the clock.

The supported signals include:

- **Session starts:** a wave hello.
- **Work begins or a tool runs:** a thinking animation.
- **Permission or input needed:** a waiting pose.
- **An error is reported:** a knock reaction, where the assistant's hooks expose that signal.
- **A response finishes:** a celebration, with dancing, waving or poolside chilling to choose from.
- **Session ends:** back to idle.

The integrations are separate and opt-in, and their coverage differs. For example, the Codex configuration does not have a dedicated tool-failure event; a post-tool callback alone cannot distinguish success from failure. The [hook guide](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/hooks.md) explains the mappings and setup for each assistant.

These are **activity notifications, not live LLM reasoning**. Maclock Clawd does not read the model's thoughts. The thinking pose is a timed animation refreshed by supported activity events. A completion dance means the response or work loop stopped—not that the code is correct or the tests passed.

That is enough to make him useful: a glance away from the terminal tells me whether the assistant has started work, needs attention, or has finished its response. And if I would rather celebrate with a wave than a dance, that is configurable too.

### A few reactions from the gallery

Here are a few hook reactions and other favourites, including the ShipStation flag, headphones and typing at a computer. **[Browse the full gallery of all 64 reactions](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md)** for the rest.

<div class="photo-grid" aria-label="Animated examples of Maclock Clawd's hook reactions and favourite scenes">
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md#finished"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/wave.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd waving hello."></a><figcaption>Session starts: a wave hello. Also available as a completion reaction.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/thinking.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd playing the thinking animation."></a><figcaption>Work begins or a tool runs: thinking. An activity signal, not live reasoning.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/waiting.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd waiting for attention."></a><figcaption>Permission or input needed: waiting for attention.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/knock.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd performing the knock-on-screen reaction."></a><figcaption>An error is reported: a knock on the screen, where the assistant exposes an error hook.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md#finished"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/dance.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd dancing."></a><figcaption>Response finishes: the default completion dance.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md#finished"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/pool.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd floating in a pool."></a><figcaption>Or choose poolside chilling as the completion reaction. Work loop over; holiday mode on.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/flag_shipstation.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd waving a flag bearing the ShipStation logo."></a><figcaption>A ShipStation flag for the desk. Trigger it with <code>flag_shipstation</code>.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/headphones.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd listening to music through headphones."></a><figcaption>Headphones on, music playing. Trigger it with <code>headphones</code>.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/desktop.gif" width="300" height="225" loading="lazy" alt="Maclock Clawd typing at a desktop computer."></a><figcaption>Busy at the computer. Trigger it with <code>desktop</code>.</figcaption></figure>
</div>

*The Clawd character and the source website artwork are © Anthropic. The ShipStation logo belongs to its owner; its appearance does not imply sponsorship or endorsement. These animated examples come from Maclock Clawd's gallery; see the [artwork and attribution notes](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/artwork.md) for source credits and rights information.*

## Tiny events, not my conversations

The recommended command-hook adapter sends only an event name, such as:

```json
{"event":"thinking"}
```

It does not forward prompts, tool arguments, paths, transcripts or model output to the clock. It has a short deadline and fails silently if the device is unavailable, so a disconnected desk companion does not hold up the actual work.

This is deliberately simple: the last accepted event wins. Multiple assistant sessions can replace each other's reactions. Maclock Clawd is one little screen, not a multi-agent control centre.

The HTTP API uses bearer authentication. Plain HTTP still exposes traffic and credentials to the network, so it belongs on a trusted LAN or behind an encrypted connection such as an SSH tunnel—not directly on the Internet.

### Make him react with a few lines of code

These examples assume the display server is already running. Use the loopback URL below for a local preview, or change it to your Pi's address on your trusted LAN. For the Pi, load and export your existing <code>PIPCLOCK_TOKEN</code> privately first; do not paste it into a script or commit it. A token-free local preview does not need that variable.

```sh
export PIPCLOCK_URL='http://127.0.0.1:8765'

clawd_event() {
  curl -q --silent --show-error --fail-with-body \
    "$PIPCLOCK_URL/api/event" \
    -H "Authorization: Bearer ${PIPCLOCK_TOKEN:-}" \
    -H 'Content-Type: application/json' \
    --data "{\"event\":\"$1\",\"duration\":20}"
}
```

Then run **one command at a time**. Each event immediately replaces the previous reaction; these commands do not queue a tour.

```sh
clawd_event flag_shipstation  # Wave the ShipStation flag.
clawd_event headphones       # Listen to music.
clawd_event desktop          # Type at a computer.
clawd_event thinking         # Show the activity pose used by work hooks.
clawd_event dance            # Celebrate, like the default completion hook.
clawd_event windows_bsod     # Pretend blue screen; the Pi keeps running.
clawd_event windows_shutdown # Pretend shutdown; no actual power-off.
clawd_event idle             # Return to the configured idle playlist.
```

To change the animation **and its caption together**, use the reaction endpoint. URL encoding keeps spaces, punctuation and non-ASCII text intact:

```sh
curl -q --silent --show-error --fail-with-body --get \
  "$PIPCLOCK_URL/api/react" \
  -H "Authorization: Bearer ${PIPCLOCK_TOKEN:-}" \
  --data-urlencode 'mood=desktop' \
  --data-urlencode 'text=Build #42: typing & shipping!' \
  --data-urlencode 'duration=20' \
  --data-urlencode 'text_size=64'
```

A timed message is independent of the animation. This one replaces the clock with a scrolling line, without changing what Maclock Clawd is doing:

```sh
curl -q --silent --show-error --fail-with-body \
  "$PIPCLOCK_URL/api/message" \
  -H "Authorization: Bearer ${PIPCLOCK_TOKEN:-}" \
  -H 'Content-Type: application/json' \
  --data '{"text":"Build finished. Time for coffee, music and a well-earned pool break!","duration":30,"text_size":64}'
```

If a reaction caption is still active, it takes priority over the message until it expires. The message's own timer keeps running in the meantime. The [API cookbook](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/api.md) covers the remaining controls. These manual requests use the same event API as the recommended hook adapter; they do not install assistant hooks.

## See him in action

[Watch the demo on YouTube](https://www.youtube.com/watch?v=3HgPzPIy_u0), or play it here:

<iframe class="video-embed" width="560" height="315" src="https://www.youtube.com/embed/3HgPzPIy_u0?si=F16RW3jv6FTZxxi7" title="Maclock Clawd desk companion demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The video is a **scripted tour of the real display**, driven by the local HTTP API. The countdown, captions and animation changes are sent directly over the network. No SSH session is needed to control the show.

It also includes a real hook notification, alongside a montage of analysis-like poses. The montage is a presentation of animations, not a recording of live LLM reasoning.

## Still a clock. Mostly.

When he is not reacting to an assistant, Maclock Clawd has **64 animated reactions** to keep him busy. A configurable idle playlist rotates through scenes, and optional physical previous/next buttons let me choose the next one myself.

The screen shows a calculator-style clock when no message or caption takes its place. The API can display large captions and timed messages; long text scrolls rather than shrinking into unreadable pixels. A small Wi-Fi indicator reports the radio's connection status.

And of course, there are two Windows-inspired Easter eggs: a Blue Screen of Death and “It's now safe to turn off your computer.” Watch the bottom of the screen: Maclock Clawd peeks up, looks around or blinks, then disappears again.

**These are visual jokes only. The Raspberry Pi keeps running.**

<div class="photo-grid" aria-label="Animated Windows-inspired Easter eggs">
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md#easter-eggs"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/windows_bsod.gif" width="300" height="225" loading="lazy" alt="A pretend Windows blue screen with Maclock Clawd peeking up from the bottom."></a><figcaption><code>windows_bsod</code>: a blue screen with a delayed Maclock Clawd peek. No actual crash.</figcaption></figure>
  <figure><a href="https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/gallery.md#easter-eggs"><img src="https://raw.githubusercontent.com/lukaszciechanowicz/maclock-clawd/main/docs/gallery/windows_shutdown.gif" width="300" height="225" loading="lazy" alt="A pretend Windows safe-to-turn-off screen with Maclock Clawd peeking up from the bottom."></a><figcaption><code>windows_shutdown</code>: “It's now safe to turn off your computer.” The Pi stays on.</figcaption></figure>
</div>

*These scenes use Windows-reference backgrounds supplied for the project. Microsoft and other third-party marks remain the property of their owners; this is not an endorsement or a redistribution licence.*

The hardware is an original **Raspberry Pi Zero W**, a **Waveshare 2.8-inch DPI LCD**, and the **Maclock enclosure**. The software is **Python, pygame, a bearer-authenticated HTTP API and optional assistant hooks**. The Pi renders natively, without needing a browser or desktop environment.

Could I use a regular clock and watch the terminal instead? Absolutely. But the regular clock would not float in a pool when the agent stops.

## Build your own—and credit the artwork

The project lives at **[github.com/lukaszciechanowicz/maclock-clawd](https://github.com/lukaszciechanowicz/maclock-clawd)**. Start there for the source, hardware notes, setup instructions and hook integrations.

**The Clawd character and the claude.dev website artwork belong to Anthropic.** Some animations are custom creations for Maclock Clawd; others use artwork from [claude.dev](https://claude.dev/), which inspired the animation style and movement. Custom animations do not imply ownership of the character.

This is an **unofficial, fan-made, open-source hardware project**. It is not affiliated with, endorsed by or sponsored by Anthropic. Third-party artwork remains the property of its respective owners; the open-source description does not grant rights to Anthropic's artwork or other third-party assets. See the project's [artwork and attribution notes](https://github.com/lukaszciechanowicz/maclock-clawd/blob/main/docs/artwork.md) before redistributing assets.
