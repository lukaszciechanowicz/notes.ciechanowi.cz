---
title: "When DNS Caching Becomes a Risk: A Hidden Failure Mode in AWS"
description: "How DNS forwarding, private hosted zones, and negative caching can turn a transient failure into an extended application outage."
slug: when-dns-caching-becomes-a-risk
pubDate: 2026-10-25
tags: [AWS, DNS, Reliability]
readingMinutes: 14
sketch: dns
---

> **TL;DR:** Years ago, a DNS forwarding issue left a service in my personal AWS account down for about 15 minutes. Negative caching was the suspected cause of delayed recovery; changing the resolution path fixed it.

Most of us expect DNS to be boring. An application asks for a hostname, receives an IP address, and moves on. In an enterprise AWS environment, however, that apparently simple lookup may cross several resolvers, forwarding rules, and caching layers.

A DNS configuration that works perfectly well on a normal day can behave very differently when just one dependency becomes temporarily unavailable. And the failure can continue after that dependency has recovered.

I ran into this several years ago while running AWS Managed Microsoft AD, Amazon Route 53, and a private DNS namespace in my own AWS environment. The affected service was unavailable for approximately **15 minutes**. The important part was not that a DNS dependency failed. It was that the way DNS handled the failure made recovery less straightforward.

This article explains the failure mode, the architecture that made it possible, what I changed at the time, and how to look for similar risks before they affect production.

> **Scope and accuracy:** The 15-minute outage, the use of a conditional forwarder for `internal.krosno.cloud`, and the successful change to a different DNS resolution path are observations from the incident. The specific root-hints-to-NXDOMAIN sequence below is a documented AWS failure mode and a plausible explanation; it should not be treated as a confirmed packet-by-packet reconstruction of this incident without DNS traces. Hostnames and application roles are illustrative.

## An enterprise-looking architecture with one subtle dependency

To illustrate the setup I had in my own AWS environment back then, imagine an order platform deployed in AWS. Its Windows application servers use the DNS servers provided by **AWS Managed Microsoft AD**. The services communicate with one another using private hostnames, with records maintained in an **Amazon Route 53 Private Hosted Zone**.

The illustrative service names are:

<div class="table-wrap" role="region" aria-label="Illustrative service hostnames" tabindex="0">

| Component | Illustrative hostname |
| --- | --- |
| Order orchestration | `prd-euw1-order-orchestrator.internal.krosno.cloud` |
| Payment authorization | `prd-euw1-payment-authorization.internal.krosno.cloud` |
| Inventory reservation | `prd-euw1-inventory-reservation.internal.krosno.cloud` |
| Shipment planning | `prd-euw1-shipment-planner.internal.krosno.cloud` |

</div>

A conditional forwarder on the Active Directory DNS servers handles `internal.krosno.cloud`. It sends matching requests toward the DNS resolution infrastructure that can access the Route 53 private zone.

A supported architecture for DNS servers that need to query a private hosted zone from another network or VPC is to use a **Route 53 Resolver inbound endpoint**. AWS warns that directly forwarding from other VPCs or on-premises DNS servers to a different VPC's `VPC+2` resolver address is unsupported and may be unstable ([AWS Route 53 Resolver documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-DSN-queries-to-vpc.html)). The exact forwarding destination in the original incident is not specified here.

```text
Order Orchestrator on EC2
   |
   | Lookup: prd-euw1-payment-authorization.internal.krosno.cloud
   v
AWS Managed Microsoft AD DNS
   |
   | Conditional forwarder: internal.krosno.cloud
   v
Route 53 Resolver (reachable through the configured DNS path)
   |
   v
Route 53 Private Hosted Zone: internal.krosno.cloud
   |
   v
Private A/AAAA record -> application endpoint
```

Under normal conditions, this works. The trap appears when a forwarded lookup cannot be completed.

AWS Managed Microsoft AD deploys DNS on its managed domain controllers. AWS specifically notes a risk when Managed Microsoft AD and Route 53 Private Hosted Zones are used together, including its **“Use root hints if no forwarders are available”** setting ([AWS Directory Service documentation](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/ms_ad_getting_started.html)).

## The failure mode: a private name escapes to public DNS

Consider this sequence:

1. The Order Orchestrator queries `prd-euw1-payment-authorization.internal.krosno.cloud`.
2. The AD DNS server matches the conditional forwarder for `internal.krosno.cloud`.
3. The forwarding target temporarily becomes unreachable or fails to answer within the available recursion window.
4. **If the DNS server's settings and remaining timeout budget permit it**, Windows DNS may attempt fallback using internet root hints.
5. Public DNS cannot resolve a hostname that exists **only** inside the Route 53 Private Hosted Zone.
6. An NXDOMAIN response can be returned and cached.
7. Forwarding connectivity recovers, but clients may continue receiving the cached negative result until it expires.

This is not hypothetical behavior invented for the article. AWS explicitly documents that when root-hints fallback is enabled and forwarders are unreachable, AWS Managed Microsoft AD may receive NXDOMAIN for private hosted zone names and cache that response, extending resolution failures after connectivity is restored ([AWS documentation](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/ms_ad_getting_started.html)).

There are two important nuances.

First, **a forwarder timing out does not always mean root-hints fallback will occur**. Windows DNS has a recursion timeout, forwarder-specific timeouts, and rules governing which responses are terminal. Depending on the timing, the result can instead be `SERVFAIL`. Microsoft describes these interactions in [DNS Forwarding and Fallback in Windows Server](https://learn.microsoft.com/en-us/windows-server/networking/dns/forwarding).

Second, an NXDOMAIN is different from an unanswered query. It makes a positive claim: *this DNS name does not exist*. For a private name that was resolved through the wrong DNS path, that answer is operationally misleading even when it is perfectly consistent with the public DNS view.

## Why the outage can outlive the original failure

DNS caches successful responses, but it can also cache negative ones. [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html) defines the caching of NXDOMAIN and NODATA responses. For cacheable negative responses from authoritative servers, the effective negative TTL is derived from the SOA record, specifically the smaller of its TTL and the SOA MINIMUM field, subject to resolver behavior and limits.

That creates a timeline like this:

```text
T+00:00  Forwarding failure begins
T+00:10  Client queries private hostname
T+00:11  DNS takes an unintended resolution path; NXDOMAIN returned
T+00:12  Negative response cached
T+00:40  Forwarding connectivity restored
T+01:00  Application still receives NXDOMAIN
   ...   Subsequent attempts can continue to fail
T+15:00  Application recovers once the relevant cached state expires
```

*This timeline is illustrative, not an exact reconstruction or proof that the incident's negative TTL was 900 seconds.* The observed downtime was approximately 15 minutes. To establish why it lasted precisely that long, we would need the cache settings, SOA values, query timestamps, and response traces.

A particularly nasty consequence is that different clients or resolvers may recover at different times. Two domain controllers provide availability, but they do not necessarily share an identical live DNS cache. An application that reaches one resolver can see an answer that differs from another resolver's answer. That is a testable possibility, not a guaranteed outcome in every deployment.

The general failure pattern is simple:

> **Recovery of the upstream dependency does not automatically invalidate an incorrect negative answer already stored downstream.**

## What I changed at the time

The affected application had been calling hosts under:

```text
prd-euw1-payment-authorization.internal.krosno.cloud
```

That suffix was handled by a conditional forwarder in AWS Managed Microsoft AD.

I changed the application-facing names and resolution configuration so that the affected services used names under:

```text
prd-euw1-payment-authorization.krosno.cloud
```

This namespace was not covered by the problematic `internal.krosno.cloud` conditional forwarder. In my environment at the time, the new resolution path reached Route 53 without traversing that particular conditional forwarding dependency, and the problem was resolved.

**The important point is the resolution path, not the shorter name.** Renaming `internal.krosno.cloud` to `krosno.cloud` does **not** inherently bypass Active Directory DNS. If clients still use AD DNS, their queries still arrive there first; the matching rules, global forwarders, VPC Resolver behavior, and private zone associations determine what happens next. Nor does removing `internal` from the name automatically make the endpoint public: a private hosted zone can use `krosno.cloud` while returning private addresses only inside associated VPCs.

Changing the namespace was the mitigation that worked for my setup. It is not a universal recommendation to rename private DNS zones instead of fixing forwarding behavior.

## How to detect this before it causes an outage

Here is a practical, read-only investigation path. The commands use illustrative IP addresses: replace them with the DNS server IPs and Route 53 Resolver inbound endpoint addresses from your own environment. **Do not run cache-clearing or configuration-changing commands against production merely to test the theory.**

### 1. Identify the DNS servers your application actually uses

On a Windows EC2 instance:

```powershell
Get-DnsClientServerAddress -AddressFamily IPv4
Get-DnsClientNrptPolicy
```

On Linux:

```bash
resolvectl status    # If systemd-resolved is used
cat /etc/resolv.conf
```

Be aware that local DNS proxies, client caches, and application runtimes may add further layers. The EC2 instance's VPC resolver configuration does not by itself prove which DNS server an individual process is querying.

### 2. Review the AD DNS forwarding configuration

From a Windows machine with the appropriate DNS Server administration tools and permissions, inspect the managed DNS server remotely:

```powershell
$DnsServer = '10.20.1.10' # Example AWS Managed AD DNS IP

Get-DnsServerConditionalForwarderZone -ComputerName $DnsServer |
  Select-Object Name, MasterServers, ForwarderTimeout, UseRecursion

Get-DnsServerForwarder -ComputerName $DnsServer
Get-DnsServerRecursion -ComputerName $DnsServer
```

These commands depend on access and permissions. AWS Managed Microsoft AD is managed by AWS; not all administrative settings or commands are available as they would be on a self-managed domain controller. If access is restricted, use supported administration interfaces or AWS Support rather than assuming full domain-controller access.

Look for:

- An unexpectedly broad conditional forwarder that catches production service names.
- Forwarding targets that are not reachable from the directory's network.
- A configuration allowing root-hints fallback when forwarders fail.
- Forwarding timeout settings that don't behave the way you expect under failure.
- Different configurations or responses on the two AD DNS IPs.

### 3. Compare answers from both AD DNS servers and the intended Route 53 path

From a suitable host with network access:

```bash
HOST=prd-euw1-payment-authorization.internal.krosno.cloud

# Illustrative addresses only
AD_DNS_1=10.20.1.10
AD_DNS_2=10.20.2.10
R53_INBOUND=10.30.1.53

dig @"$AD_DNS_1" "$HOST" A +time=2 +tries=1
dig @"$AD_DNS_2" "$HOST" A +time=2 +tries=1
dig @"$R53_INBOUND" "$HOST" A +time=2 +tries=1
```

Inspect the status (`NOERROR`, `NXDOMAIN`, or `SERVFAIL`), the `ANSWER` and `AUTHORITY` sections, and the returned TTLs. Run the comparison repeatedly during a controlled test or an incident.

If Route 53 returns a valid private address while an AD DNS server returns NXDOMAIN, you have localized the discrepancy to some part of the path through that DNS server. It is **not by itself proof** that root hints or negative caching caused it.

For a negative answer, include the SOA information rather than using `+short`, which hides the details you need:

```bash
dig @"$AD_DNS_1" "$HOST" A +noall +comments +answer +authority
```

### 4. Check AWS DNS rule precedence and zone visibility

A very useful and easy-to-miss AWS behavior: if a Route 53 Resolver forwarding rule and a Private Hosted Zone match the **same domain name**, the forwarding rule takes precedence. That means a correct private record may exist while queries are routed elsewhere ([AWS: Private Hosted Zone considerations](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-considerations.html)).

For an AWS CLI investigation:

```bash
aws route53 list-hosted-zones-by-name --dns-name internal.krosno.cloud

aws route53resolver list-resolver-rules --region eu-west-1

aws route53resolver list-resolver-rule-associations --region eu-west-1
```

Check that the hosted zone is **private**, that it is associated with the right VPCs (including cross-account associations), and that forwarding rules do not accidentally override the zone. `list-hosted-zones-by-name` shows names, not every VPC association; follow up with `get-hosted-zone` for the relevant zone ID and check the associations and account context.

AWS describes these matching rules in [Route 53 Resolver documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-forward-vpc-to-network-where-to-forward-queries.html).

### 5. Distinguish NXDOMAIN from SERVFAIL and timeout

They may look identical to a user whose application cannot connect, but they are different at the DNS layer.

<div class="table-wrap" role="region" aria-label="DNS outcomes and diagnostic implications" tabindex="0">

| DNS outcome | Meaning | Diagnostic implication |
| --- | --- | --- |
| `NOERROR` with A/AAAA answer | Name resolves | Check whether the returned address is the intended one |
| `NXDOMAIN` | Name does not exist in the answering DNS view | Inspect negative caching, authority, and unintended resolution paths |
| `NOERROR` with no matching answer (`NODATA`) | Name exists, requested record type absent | Inspect record types and the authority section |
| `SERVFAIL` | Resolver could not complete resolution | Check forwarder failures, recursion limits, DNSSEC, and server behavior |
| Timeout | No response before the client's deadline | Check reachability, filtering, latency, and overloaded resolvers |

</div>

[RFC 9520](https://www.rfc-editor.org/rfc/rfc9520.html) also addresses caching of DNS resolution failures, making it important not to conflate all failures with ordinary NXDOMAIN caching.

### 6. Add a small synthetic DNS check

Rather than monitor only the application's health endpoint, query one or more **existing critical private names** through the same resolver path your application uses. Collect:

- The response status, returned IP, and query latency.
- The DNS server that answered.
- Differences between both AD DNS servers and the intended Route 53 path.
- How long an NXDOMAIN or SERVFAIL persists after upstream DNS becomes healthy.

Avoid high-frequency queries and random nonexistent hostnames, which can obscure the signal or create unnecessary DNS load. A simple scheduled comparison from representative application subnets will often reveal more than a generic DNS availability check.

For deeper investigation, consider [Route 53 Resolver query logging](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-query-logs.html), while remembering that logs from the AWS resolver side do not automatically expose all cache hits inside Windows DNS or on client machines.

## Designing a safer resolution path

The goal isn't to disable all negative caching. DNS negative caching is standardized and useful. The goal is to prevent a momentary failure from sending private queries into an inappropriate namespace and then persisting the resulting answer.

A reasonable design review should cover:

1. **Explicit DNS ownership:** Know which service is authoritative for each internal zone and which resolvers may access that view.
2. **Correct forwarding destinations:** Use supported Route 53 Resolver inbound endpoints when appropriate across VPC or network boundaries; don't assume another VPC's `VPC+2` address is a supported forwarding target.
3. **Fallback behavior:** Review the AWS Managed Microsoft AD root-hints setting. AWS explicitly suggests considering turning it off in this private DNS scenario. Assess the effects on other zones before changing it.
4. **Rule precedence:** Check conditional forwarders, global forwarders, Resolver rules, and Private Hosted Zone associations for conflicting ownership.
5. **Timeouts and TTLs:** Validate actual outcomes during failures. A 15-minute application outage does not necessarily mean a configured 15-minute DNS TTL.
6. **Application resilience:** Retry DNS-dependent connections sensibly, but recognize that retries against a resolver with a cached NXDOMAIN cannot force the resolver to forget its cached response.
7. **Recovery testing:** Verify recovery time after DNS connectivity is restored, not just the initial detection time.

One anti-pattern deserves emphasis: pointing a forwarding rule at a resolver path that ultimately forwards the same query back to its source. AWS documents the risk of **Resolver endpoint loops** ([AWS guidance](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/best-practices-resolver-endpoints.html)).

## The takeaway

A failed DNS lookup might not mean the record is missing. It might mean the request reached the wrong part of your DNS architecture.

And the most surprising part is what happens after the original issue is fixed: the wrong answer may still be cached. In that incident on my personal AWS account several years ago, the application experienced approximately 15 minutes of downtime, and moving the affected names away from the problematic conditional forwarding path resolved the problem.

If your AWS environment combines Managed Microsoft AD with Route 53 Private Hosted Zones, don't stop at checking that DNS works today. **Test where private queries go when the intended forwarder stops answering, and test how quickly the application recovers afterward.**

That is where a routine DNS configuration can become an availability risk.

---

## References

1. [AWS Directory Service: Getting started with AWS Managed Microsoft AD](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/ms_ad_getting_started.html) — AWS warning about root-hints fallback, NXDOMAIN for private zones, and prolonged failures.
2. [Microsoft Learn: DNS Forwarding and Fallback in Windows Server](https://learn.microsoft.com/en-us/windows-server/networking/dns/forwarding) — forwarding behavior, retry and recursion timeouts.
3. [AWS: Resolving DNS queries between VPCs and your network](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-DSN-queries-to-vpc.html) — supported inbound Resolver endpoints and restrictions on cross-VPC `VPC+2` forwarding.
4. [AWS: Considerations when working with private hosted zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zone-private-considerations.html) — private zone associations, custom DNS, and forwarding-rule precedence.
5. [AWS: How VPC Resolver determines where to forward DNS queries](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-overview-forward-vpc-to-network-where-to-forward-queries.html) — rule matching and forwarding behavior.
6. [AWS: Avoid loop configurations with Resolver endpoints](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/best-practices-resolver-endpoints.html) — circular forwarding risks.
7. [AWS: Route 53 Resolver query logging](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-query-logs.html) — visibility into queries handled by Resolver.
8. [Microsoft Learn: Add-DnsServerConditionalForwarderZone](https://learn.microsoft.com/en-us/powershell/module/dnsserver/add-dnsserverconditionalforwarderzone) — conditional forwarding parameters.
9. [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308.html) — NXDOMAIN/NODATA caching and SOA-derived TTL.
10. [RFC 9520: Negative Caching of DNS Resolution Failures](https://www.rfc-editor.org/rfc/rfc9520.html) — additional resolution failure caching requirements.
