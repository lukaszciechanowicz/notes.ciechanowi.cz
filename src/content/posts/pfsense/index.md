---
title: Finding the missing gigabit in my pfSense firewall
description: How packet queues, monitoring overhead, and a CPU power policy helped me recover the 2 Gbps my Orange connection already offered.
slug: finding-the-missing-gigabit-in-my-pfsense-firewall
pubDate: 2026-10-17
tags: [pfSense, AI]
readingMinutes: 13
sketch: firewall
---

<nav aria-label="Article sections">
  <a href="#setup">The setup</a>
  <a href="#queues">The queue</a>
  <a href="#monitoring">The monitor</a>
  <a href="#powerd">The CPU</a>
  <a href="#results">The results</a>
  <a href="#references">Sources</a>
</nav>

I wanted to try OhMyPi. I also had a small mystery: my son’s wired PC wasn’t getting much better Internet speed-test results than my Mac over Wi-Fi.

The connection was supposed to be 2 Gbps. The wired path was built around 2.5GbE. Yet I was seeing roughly a gigabit. A suspiciously neat number, and exactly the sort of thing that makes you start blaming a cable.

So, for my first interaction with OhMyPi, I used an assistant to investigate the firewall over SSH. The instruction was deliberately boring: **read-only analysis first; propose changes and explain them before touching anything.** This is my home’s production firewall, not a disposable VM.

We eventually got the wired speed test to the full advertised rate without replacing the box. The interesting bit is what changed—and what the measurements do, and do not, let me claim.

<section id="setup" aria-labelledby="setup-title">

<h2 id="setup-title">First, rule out the obvious gigabit link</h2>

The path was a wired client, a 2.5GbE switch, pfSense, and an Orange Funbox connected to a 2 Gbps Internet service. Both the switch-to-firewall link and firewall-to-Funbox link were intended to run at 2.5 Gbps.

<figure class="network-figure" id="network-diagram">
<div class="diagram-scroll" tabindex="0" role="region" aria-label="Home network diagram; scroll horizontally on narrow screens">
<svg xmlns="http://www.w3.org/2000/svg" class="network-art" viewBox="0 0 1000 500" fill="none" role="img" aria-labelledby="network-title network-description">
<title id="network-title">Where the missing gigabit went</title>
<desc id="network-description">My Mac connects wirelessly to a Wi-Fi mesh. The mesh and my son's wired PC connect to a switch. The switch connects to pfSense, then to the Orange Funbox, then to the Internet. The four wired LAN and gateway links are 2.5GbE. The Orange Internet plan is 2 Gbps. A warm arrow identifies pfSense packet processing as the bottleneck investigated.</desc>
<g stroke="var(--fg, currentColor)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
<g id="network-links">
<path id="mac-mesh-link" d="M139 92C175 89 211 96 258 91" stroke-dasharray="1 9"/>
<path id="mesh-switch-link" d="M300 116C297 169 304 222 299 282"/>
<path id="pc-switch-link" d="M133 300C172 298 213 302 258 300"/>
<path id="switch-firewall-link" d="M343 300C379 303 417 297 457 301"/>
<path id="firewall-funbox-link" d="M544 300C580 298 621 303 665 300"/>
<path id="funbox-internet-link" d="M736 301C771 299 808 304 849 301"/>
</g>
<g id="mac-device">
<path d="M44 64C68 62 99 65 124 63L126 110L43 110L44 64ZM49 69L119 69L120 104L49 104L49 69M42 112L29 123C61 127 99 126 138 124L126 112M62 119L104 119"/>
<path d="M51 132C74 133 105 132 126 131M52 73L52 99" opacity=".25" stroke-width=".9"/>
</g>
<g id="mesh-device">
<path d="M260 94C263 84 335 84 341 93C345 102 336 115 302 116C274 117 257 107 260 94ZM261 94C273 106 326 106 340 94"/>
<path d="M280 75C290 65 310 65 321 75M287 81C296 73 307 74 314 81M298 86L302 86" stroke-width="1.3"/>
<path d="M269 118C285 122 318 123 333 117" opacity=".25" stroke-width=".9"/>
</g>
<g id="pc-device">
<path d="M46 265C68 263 97 266 121 264L121 313L46 314L46 265ZM52 271L115 270L115 306L53 307L52 271M78 315L79 328M67 331L96 330"/>
<path d="M17 274L35 273L35 327L17 328L17 274ZM22 282L30 282M22 289L30 289M25 316L27 316M124 292L132 292L133 308"/>
<path d="M47 319L69 320M101 319L119 318" opacity=".25" stroke-width=".9"/>
</g>
<g id="switch-device">
<path d="M261 282C282 280 320 282 339 283C344 291 343 312 340 321C318 324 280 322 259 322C256 313 257 290 261 282ZM262 294C287 296 314 293 338 295"/>
<path d="M266 303L275 303L275 312L266 312L266 303ZM282 303L291 303L291 312L282 312L282 303ZM298 303L307 303L307 312L298 312L298 303ZM315 303L324 303L324 312L315 312L315 303" stroke-width="1.2"/>
<path d="M263 328C283 330 317 328 336 329" opacity=".25" stroke-width=".9"/>
</g>
<g id="firewall-device" stroke="var(--accent, currentColor)">
<path d="M462 277C483 275 518 277 537 278C544 289 542 311 539 325C517 327 481 326 459 325C456 314 456 291 462 277Z"/>
<path d="M462 290C470 290 476 291 480 290M520 290L535 290M465 313L473 313M526 313L534 313" stroke-width="1.2"/>
<path d="M487 287L500 282L513 287L512 302C511 309 505 315 500 317C491 313 486 306 487 298L487 287ZM494 299L499 304L507 294"/>
<path d="M463 331L536 332" opacity=".3" stroke-width=".9"/>
</g>
<g id="funbox-device">
<path d="M672 254C688 250 713 254 728 252L733 323C714 328 685 326 668 324L672 254ZM678 261L722 261M677 269L722 270M680 278L720 278M681 286L720 287"/>
<path d="M675 331C691 333 715 331 730 332M674 257L672 284" opacity=".25" stroke-width=".9"/>
</g>
<g id="internet-device">
<path d="M866 287C854 285 847 293 850 303C852 312 861 316 871 314C868 326 881 333 895 329C906 338 921 332 925 324C940 331 953 325 952 315C965 311 968 300 960 294C966 282 951 272 939 277C930 264 910 265 900 273C888 259 869 268 866 281"/>
<path d="M880 338C899 343 924 338 935 333" opacity=".25" stroke-width=".9"/>
</g>
</g>
<g stroke="var(--accent, currentColor)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M300 109L303 109M330 287L333 287M682 311L685 311M694 312L697 312"/>
<path d="M620 416C608 389 577 355 543 328M543 328L547 339M543 328L554 332"/>
<path d="M447 266L441 260M454 257L452 249M548 276L554 270M548 285L558 283" stroke-width="1.1"/>
</g>
<g fill="var(--fg, currentColor)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" font-size="18" font-weight="500" text-anchor="middle">
<text x="83" y="154">My Mac</text>
<text x="300" y="43">Wi-Fi mesh</text>
<text x="79" y="363">My son’s PC</text>
<text x="300" y="363">2.5GbE switch</text>
<text x="500" y="363" fill="var(--accent, currentColor)">pfSense</text>
<text x="701" y="363">Orange Funbox</text>
<text x="906" y="363">Internet</text>
</g>
<g fill="var(--muted, currentColor)" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="14" text-anchor="middle">
<text x="194" y="73">Wi-Fi</text>
<text x="347" y="204">2.5 GbE</text>
<text x="194" y="276">2.5 GbE</text>
<text x="400" y="276">2.5 GbE</text>
<text x="600" y="276">2.5 GbE</text>
<text x="792" y="276">2 Gbps plan</text>
<text x="83" y="178">Monitoring</text>
<text x="79" y="386">Wired speed test</text>
</g>
<g fill="var(--accent, currentColor)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" text-anchor="middle">
<text x="662" y="446" font-size="19" font-weight="500">The bottleneck was here.</text>
<text x="662" y="471" font-size="14" fill="var(--muted, currentColor)">pfSense forwarding, not a different Orange plan.</text>
</g>
<g stroke="var(--muted, currentColor)" stroke-width="1.5" stroke-linecap="round">
<path d="M41 425L68 425" stroke-dasharray="1 7"/>
<path d="M41 451C49 449 60 453 68 451"/>
</g>
<g fill="var(--muted, currentColor)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" font-size="14">
<text x="80" y="430">Wi-Fi connection</text>
<text x="80" y="456">Wired connection</text>
</g>
</svg>
</div>
<figcaption>The wired test path and the Mac used for SSH monitoring. The last label is the Orange service rate, not an Ethernet negotiation speed. On a narrow screen, scroll the drawing sideways.</figcaption>
</figure>

The firewall itself was running pfSense CE 2.8.1 on bare metal, with an Intel Celeron N4000, about 8 GB of RAM, and Intel I226-V Ethernet controllers using FreeBSD’s `igc` driver. WAN was `igc0`; LAN was `igc1`.

The initial inspection covered link negotiation, interface errors, PCIe links, routing, NAT, active filtering and shaping, network memory, CPU state, and processes. Some of the useful read-only commands were:

```sh
ifconfig igc0
ifconfig igc1
netstat -ibdn
netstat -rn
pfctl -si
pfctl -sr
pfctl -sn
pfctl -sq
netstat -m
netstat -Q
netstat -B
```

Both WAN and LAN reported:

```text
media: Ethernet autoselect (2500Base-T <full-duplex>)
status: active
```

There were no CRC errors or receive overruns on those two interfaces, no NIC watchdog timeouts, no active shaper queues, and no evidence of exhausted network-memory pools. That didn’t certify the entire path as perfect, but it ruled out the simple explanation that either firewall port had negotiated down to gigabit.

pfSense’s WAN was an ordinary IPv4 Ethernet interface with the Funbox as its gateway. There was no PPPoE interface on pfSense to tune. The cards already had two RX/TX queues each, with MSI-X enabled. We left those alone.

**A 2.5GbE label describes a link, not a forwarding benchmark.** It tells you nothing, by itself, about how much packet processing the CPU and software configuration can sustain.

</section>

<section id="bandwidthd" aria-labelledby="bandwidthd-title">

<h2 id="bandwidthd-title">The monitoring was not free</h2>

`netstat -B` produced a much more interesting clue: eight `bandwidthd` BPF readers attached to the LAN interface. The process tree showed two groups of four running processes, and the readers had nearly identical received-packet counts.

[FreeBSD’s BPF manual](https://man.freebsd.org/cgi/man.cgi?query=bpf&sektion=4&manpath=FreeBSD+15.0-RELEASE) explains why this matters: multiple listeners on an interface see the same packet stream, each applies its own filter, and a listener accepting a packet receives a capture copy. Capturing and accounting for traffic adds work alongside forwarding it.

There are two easy ways to overstate this finding. First, eight readers do not establish an eightfold CPU cost or eight full-packet copies. Filters and capture lengths matter. Second, multiple processes are not automatically a bug: [BandwidthD’s source](https://github.com/NethServer/bandwidthd/blob/master/bandwidthd.c#L362-L398) deliberately forks workers for different reporting periods. We did not establish why this machine had two process trees.

Some BPF readers also had drop counts. Those were *capture-buffer* drops: the monitoring application had missed capture records. They were not proof that the original packets had failed to reach the Internet. Same word, different layer.

I disabled `bandwidthd`. At the same stage, I also increased an IPv4 input-queue limit. The next speed-test result was better. Because I changed both before that measurement, I can’t honestly split the gain between them. The capture overhead was a strong suspect, not a separately measured percentage.

</section>

<section id="queues" aria-labelledby="queues-title">

<h2 id="queues-title">The queue that was actually dropping packets</h2>

The other clue was inside the network stack:

```text
net.inet.ip.intr_queue_maxlen: 1000
net.inet.ip.intr_queue_drops: 32126
```

The first value limits the number of packets waiting in an IPv4 `netisr` input queue. The second is an accumulated drop counter. It is not a bandwidth setting, a TCP receive window, or the NIC’s hardware receive ring.

More precisely, the limit applies to each IPv4 workstream queue. This machine exposed two workstreams, one per CPU. [FreeBSD’s implementation](https://github.com/freebsd/freebsd-src/blob/releng/15.0/sys/net/netisr.c#L505-L608) updates the per-workstream limits and sums their drop counters for the protocol-wide total. It is not one shared budget that both cores can borrow from.

When a packet needs to be enqueued and there is no room, the [enqueue path](https://github.com/freebsd/freebsd-src/blob/releng/15.0/sys/net/netisr.c#L987-L1026) frees the packet, increments the queue’s drop count, and returns `ENOBUFS`. That is a real input-queue drop, unlike a missed monitoring record.

So “the CPU was dropping packets” is understandable shorthand, but the precise statement is: **the kernel had rejected packets because an IPv4 input queue was full.** The counter alone doesn’t tell us which traffic caused it or whether the underlying pressure was a short burst, scheduling, or a sustained processing bottleneck.

The initial `netstat -Q` output showed that both queues had reached the configured ceiling. Following [Netgate’s input-queue troubleshooting guidance](https://docs.netgate.com/pfsense/en/latest/hardware/tune.html#ip-input-queue-intr-queue), I doubled the limit:

```sh
sysctl net.inet.ip.intr_queue_maxlen=2000
```

That gave *each* IPv4 input queue room for 2,000 waiting packets. It did not make either core execute instructions faster.

### Why this can hurt TCP without breaking the connection

A full queue can discard an IP packet even though the Ethernet link has plenty of nominal bandwidth. For a TCP data flow, missing data can then have two costs: the sender may need to transmit those bytes again, and its congestion-control response can reduce the amount of data it keeps in flight.

[TCP provides a reliable, ordered byte stream](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2). It repairs missing data at the transport layer. It does **not** rerun an application function or replay an HTTP request just because a segment was lost. Application-level retries are a separate thing.

Recovery also does not always mean waiting for a timeout. The classic [fast-retransmit mechanism](https://www.rfc-editor.org/rfc/rfc5681.html#section-3.2) can infer loss from duplicate acknowledgments and retransmit earlier. The exact recovery and congestion response depend on the endpoints and their algorithms.

That explains a mechanism by which queue loss can reduce useful throughput. **We did not take a packet capture or collect endpoint TCP statistics to prove retransmissions in this session.** The queue counters don’t identify the affected flows, their transport protocol, or the cost of any particular loss.

</section>

<section id="monitoring" aria-labelledby="monitoring-title">

<h2 id="monitoring-title">Watch the queue, but measure the drops</h2>

The speed test ran on a different, wired computer. The Mac could stay on Wi-Fi for the SSH monitoring session; it wasn’t the traffic generator for this part.

We put a small read-only script at `/root/monitor-ip-queue.sh`:

```sh
#!/bin/sh

previous=$(sysctl -n net.inet.ip.intr_queue_drops)

while :; do
current=$(sysctl -n net.inet.ip.intr_queue_drops)

printf '\n%s  IP drops: total=%s  delta=%s\n' \
    "$(date '+%H:%M:%S')" "$current" "$((current - previous))"

netstat -Q | awk '
    $3 == "ip" {
        printf "CPU %s: Len=%s  WMark=%s  QDrops=%s\n",
            $2, $4, $5, $8
    }
'

previous=$current
sleep 1
done
```

I launched it with:

```sh
ssh -t pf /root/monitor-ip-queue.sh
```

Here `pf` is my SSH host alias. The script polls roughly once a second and prints the IPv4 queues from `netstat -Q`, plus the change in the aggregate input-drop counter. It doesn’t reset counters or modify the firewall. The positional `awk` fields match this machine’s output; check yours before reusing it on a different version.

<div class="table-wrap">
  <table>
    <caption>What the monitor is actually showing</caption>
    <thead><tr><th scope="col">Field</th><th scope="col">Meaning</th></tr></thead>
    <tbody>
      <tr><th scope="row"><code>Len</code></th><td>Packets waiting in that workstream’s IPv4 queue at the sampled instant.</td></tr>
      <tr><th scope="row"><code>WMark</code></th><td>The queue’s recorded high-water mark, not the limit and not necessarily a peak from the current test.</td></tr>
      <tr><th scope="row"><code>QDrops</code></th><td>Accumulated overflow drops for that queue, not drops per second.</td></tr>
      <tr><th scope="row"><code>delta</code></th><td>New aggregate IPv4 input-queue drops since the previous poll.</td></tr>
    </tbody>
  </table>
</div>

One sample from the test was particularly useful:

```text
20:12:59  IP drops: total=45860  delta=0
CPU 0: Len=0     WMark=1545  QDrops=21385
CPU 1: Len=1316  WMark=1527  QDrops=24475
```

One queue actually held 1,316 packets—more than the old limit allowed. The additional headroom was being used, not just configured. Meanwhile, the aggregate drop counter hadn’t increased since the previous poll.

Notice what this does *not* say. It doesn’t prove that exactly 316 packets would have been lost with the old setting; the traffic dynamics could have been different. It doesn’t show that those historical high-water marks were reached in this test. And zero new input-queue drops in one interval does not certify zero packet loss everywhere.

The drop delta is more useful than a string of empty `Len` samples. A queue can fill and drain between one-second polls. Counters retain evidence of that overflow even if every occupancy snapshot misses it. The `sysctl` and `netstat` reads are separate, too: this is a practical monitor, not an atomic trace.

Alongside it, the CPU view was:

```sh
ssh -t pf 'top -P -H -S'
```

That exposes per-CPU utilization, threads, and system processes. The useful question is whether an individual core runs out of idle time during the transfer—not whether an overall average looks reassuring. We had not captured a final under-load CPU trace that would quantify the remaining bottleneck.

### Why not just set the queue to a million?

Because queue capacity is not processing capacity. More headroom can absorb a burst; it cannot fix a sustained inability to drain the queue. A larger limit doesn’t inherently add latency, but allowing a queue to remain deep means packets can spend longer waiting.

[RFC 7567](https://www.rfc-editor.org/rfc/rfc7567.html#section-2) makes the distinction nicely: queues should normally be small, with enough capacity to absorb bursts. This experiment did not implement AQM or establish a latency optimum. Once the target throughput was reachable, there was no evidence-based reason to keep increasing the number.

</section>

<section id="powerd" aria-labelledby="powerd-title">

<h2 id="powerd-title">The remaining clue was a CPU power policy</h2>

With `bandwidthd` disabled and the larger queue, there was still some performance missing. The initial CPU inspection had shown:

```text
dev.cpu.0.freq: 1100
dev.cpu.1.freq: 1100
dev.cpu.0.freq_levels: 1101/0 1100/0 1000/0 900/0 800/0
```

`powerd` wasn’t running. The frequency-control driver was `est`, FreeBSD’s Enhanced SpeedStep driver.

That is a clue, not proof of a CPU stuck at its base clock. An idle-time `sysctl` reading is not an under-load frequency trace, and the exposed control states should not be read as a direct measurement of instantaneous Burst frequency.

Still, [Netgate documents this exact class of problem](https://docs.netgate.com/pfsense/en/latest/config/advanced-misc.html#powerd):

> “Some hardware requires `powerd` running to operate at its maximum attainable CPU frequency.”

The recommendation is to enable PowerD and select *Maximum* for at least AC power. That made this a better experiment than another random networking tunable.

There’s a useful hardware-specific detail here. [Intel lists the N4000](https://www.intel.com/content/www/us/en/products/sku/128988/intel-celeron-processor-n4000-4m-cache-up-to-2-60-ghz/specifications.html) as a two-core CPU with a 1.10 GHz base frequency, up to 2.60 GHz *Burst*, Enhanced SpeedStep support, and no Speed Shift support. Intel also lists Turbo Boost as unsupported. “Burst” is the appropriate term here; this wasn’t a case of enabling modern Speed Shift or overclocking the chip.

With no existing PowerD process running, the temporary test command was:

```sh
/usr/sbin/powerd -a max -n max -b hadp
```

According to the [PowerD manual](https://man.freebsd.org/cgi/man.cgi?query=powerd&sektion=8&manpath=FreeBSD+15.0-RELEASE), `-a` selects AC-power policy, `-n` covers an unknown AC-line state, and `-b` selects battery policy. Here AC and unknown use the highest-performance policy; battery uses `hiadaptive`.

**The next wired speed test reached the advertised rate.**

That makes CPU power management a strong explanation for the remaining performance gap in this configuration. It does not establish that both cores ran at 2.6 GHz, or quantify how much extra power the setting used. We did not measure either. Maximum policy asks for the highest available performance; it is not a promise of a fixed clock.

</section>

<section id="results" aria-labelledby="results-title">

<h2 id="results-title">What changed, and how strong is the evidence?</h2>

<div class="table-wrap">
  <table>
    <caption>Rounded, reported Internet speed-test results from this session—not repeated-run medians or packet-generator measurements.</caption>
    <thead><tr><th scope="col">Configuration at that stage</th><th scope="col">Observed rate</th><th scope="col">What it supports</th></tr></thead>
    <tbody>
      <tr><th scope="row">Original configuration</th><td>~1 Gbps</td><td>The wired Internet path was underperforming despite 2.5GbE WAN/LAN links.</td></tr>
      <tr><th scope="row">Input-queue limit 2,000; <code>bandwidthd</code> disabled</th><td>~1.5 Gbps</td><td>The combined change improved the result. Individual contributions were not isolated.</td></tr>
      <tr><th scope="row">Same setup, plus PowerD Maximum for AC/unknown power</th><td>~2 Gbps</td><td>The subsequent power-policy change was followed by reaching the advertised service rate.</td></tr>
    </tbody>
  </table>
</div>

<figure class="result-figure">
  <a href="/images/pfsense/speedtest.png">
    <img src="/images/pfsense/speedtest.png" alt="Two speed-test results: download increased from 1075.98 to 2091.40 Mbps; respectively." width="4082" height="1284" loading="lazy" decoding="async">
  </a>
  <figcaption>The recorded before-and-after speed tests: download rose from about 1.08 to 2.09 Gbps. Open the image for the full-size results.</figcaption>
</figure>

The practical result was roughly twice the useful Internet throughput on the tested wired path, on the same hardware. The ISP connection itself wasn’t upgraded. This does not mean every device, Wi-Fi client, VPN, tiny-packet workload, or single TCP stream can now do the same.

My Orange plan was already 2 Gbps. Removing unnecessary monitoring overhead and correcting the local queue and CPU power-policy configuration recovered capacity I was already paying for; it was not an ISP line upgrade or an extra gigabit appearing from nowhere. Neither the contract nor the hardware changed. The combined measurements support that practical recovery, not a precise allocation of the gain to each setting.

This was troubleshooting, not a controlled performance paper. We didn’t save a matrix of repeated runs, freeze all Internet-side variables, or run a reversion test for each change. Server load and path conditions can affect speed tests. For a stronger benchmark I’d keep the client, test server, connection count, and background load fixed, repeat each condition, and add latency-under-load and endpoint loss measurements.

There is still a useful result here without turning it into a universal “make pfSense twice as fast” recipe. The input queues had demonstrably overflowed. The larger limit was demonstrably used. The capture path had multiple listeners doing work. And changing CPU power policy was followed by achieving the target throughput.

</section>

<section id="persistent" aria-labelledby="persistent-title">

<h2 id="persistent-title">Making the working settings survive a reboot</h2>

A shell `sysctl` change is a runtime adjustment, and manually launching a daemon is not the same as configuring pfSense to start it. For persistence, the corresponding GUI settings are:

- **System → Advanced → System Tunables:** add or edit `net.inet.ip.intr_queue_maxlen` with value `2000`.
- **System → Advanced → Miscellaneous → PowerD:** enable PowerD, set AC Power and Unknown Power to *Maximum*, and Battery Power to *Hiadaptive*.
- Leave the disabled traffic-monitoring package disabled unless its cost is worth measuring and accepting.

These are the settings corresponding to this experiment, not a claim that we performed a reboot-and-retest afterward. [Netgate documents the GUI mechanism](https://docs.netgate.com/pfsense/en/latest/config/advanced-tunables.html#managing-runtime-tunables) for persistent runtime tunables.

I would not blindly apply the same CPU policy to another firewall. Netgate prefers Speed Shift on supported hardware; this N4000 doesn’t support it. More aggressive performance policy can change power use and heat, so temperature and stability deserve attention during longer transfers.

We also resisted the temptation to turn on every offload option. TSO and LRO were already disabled, in line with [Netgate’s guidance](https://docs.netgate.com/pfsense/en/latest/hardware/tune.html#tso-lro). Nothing in this session justified changing them or adding unrelated TCP-buffer tweaks.

</section>

<section id="takeaway" aria-labelledby="takeaway-title">

<h2 id="takeaway-title">A good first session—and a better mental model</h2>

The useful part of trying OhMyPi wasn’t a magical optimization command. It was the loop: inspect the running system, form a hypothesis, check the documentation, make a change I approved, then watch something more informative than a speedometer.

I still made the changes and ran the speed tests. The assistant helped turn a pile of FreeBSD counters into questions I could test. That is a much more useful role than confidently prescribing twenty tunables.

And that’s a pretty satisfying first blog post: I went looking for a bad cable, found work happening in the packet path and a consequential CPU power policy, and got the throughput I was already paying for.

Same firewall. Same NICs. A much better explanation of where the missing gigabit went.

</section>

<section id="references" aria-labelledby="references-title">

<h2 id="references-title">Sources and implementation notes</h2>

<p class="small">Observed configuration, counters, and the quoted sample come from the troubleshooting session. The stages table uses rounded speed-test results I reported during it; the screenshot preserves the displayed measurements. The links below support the mechanisms and commands, not an independent reproduction of those results. FreeBSD 15.0 source is a reference for implementation details, not a byte-for-byte audit of pfSense’s patched 15.0-CURRENT kernel.</p>

<ol class="sources">
  <li><a href="https://docs.netgate.com/pfsense/en/latest/hardware/tune.html#ip-input-queue-intr-queue">Netgate: IP input queue tuning</a> — the queue-limit/drop OIDs and troubleshooting by increasing the limit.</li>
  <li><a href="https://github.com/freebsd/freebsd-src/blob/releng/15.0/sys/netinet/ip_input.c">FreeBSD 15.0: IPv4 input implementation</a> and <a href="https://github.com/freebsd/freebsd-src/blob/releng/15.0/sys/net/netisr.c">netisr implementation</a> — per-workstream limits, aggregated drops, overflow handling, and high-water marks. <a href="https://github.com/freebsd/freebsd-src/blob/releng/15.0/usr.bin/netstat/netisr.c">netstat’s netisr output</a> maps the displayed fields.</li>
  <li><a href="https://man.freebsd.org/cgi/man.cgi?query=bpf&amp;sektion=4&amp;manpath=FreeBSD+15.0-RELEASE">FreeBSD bpf(4)</a> — multiple listeners, filtering, capture delivery, and capture-buffer drops.</li>
  <li><a href="https://bandwidthd.sourceforge.net/">BandwidthD project</a> and <a href="https://github.com/NethServer/bandwidthd/blob/master/bandwidthd.c#L362-L398">a maintained 2.0.1-based source tree</a> — reporting periods and intentional worker processes. These are not proof of the precise provenance of the installed binary.</li>
  <li><a href="https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2">RFC 9293 §2.2</a> and <a href="https://www.rfc-editor.org/rfc/rfc9293.html#section-3.7">§3.7</a> — reliable TCP byte-stream delivery, retransmission, and why TCP segment boundaries do not correspond to application calls.</li>
  <li><a href="https://www.rfc-editor.org/rfc/rfc5681.html#section-3.2">RFC 5681 §3.2</a> — classic fast retransmit/recovery and congestion response; not a claim that the test endpoints used only these algorithms.</li>
  <li><a href="https://www.rfc-editor.org/rfc/rfc7567.html#section-1.2">RFC 7567 §1.2</a>, <a href="https://www.rfc-editor.org/rfc/rfc7567.html#section-2.3">§2.3</a>, and <a href="https://www.rfc-editor.org/rfc/rfc7567.html#section-4.2">§4.2</a> — burst absorption, queueing delay, buffer sizing, and the efficiency cost of loss in reliable transports.</li>
  <li><a href="https://docs.netgate.com/pfsense/en/latest/config/advanced-misc.html#powerd">Netgate: PowerD</a> and <a href="https://man.freebsd.org/cgi/man.cgi?query=powerd&amp;sektion=8&amp;manpath=FreeBSD+15.0-RELEASE">FreeBSD powerd(8)</a> — policy modes, command-line flags, and the documented maximum-frequency caveat on some hardware.</li>
  <li><a href="https://www.intel.com/content/www/us/en/products/sku/128988/intel-celeron-processor-n4000-4m-cache-up-to-2-60-ghz/specifications.html">Intel Celeron N4000 specifications</a> — core count, base/Burst frequencies, SpeedStep, and lack of Speed Shift and Turbo Boost support.</li>
  <li><a href="https://docs.netgate.com/pfsense/en/latest/config/advanced-tunables.html">Netgate: System Tunables</a> — runtime changes versus persistent configuration. <a href="https://docs.netgate.com/pfsense/en/latest/hardware/tune.html#tso-lro">Netgate: TSO/LRO</a> — why we left those offloads disabled.</li>
</ol>
</section>
