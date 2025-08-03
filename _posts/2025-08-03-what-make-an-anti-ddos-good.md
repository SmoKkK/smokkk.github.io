---
title: "What makes an Anti-DDoS good?"
date: 2025-08-03 02:00:00 +0000
categories: [Guides]
tags: [security]
---
## Context:

After spending some time performing DDoS attacks using both infected machines and IPHM (IP Header Modification) enabled servers, I started to wonder: what makes a good anti-DDoS service?

## TL;DR

*   Block bad ASNs
*   Filter out suspicious packets to prevent list-based amplification attacks and blacklist bypassing
*   Healthy rate limiting
*   Access to AbuseDB (not a must-have, but very beneficial)

Now that I've gotten rid of lazy readers, let's start with

### 1. Blocking Bad ASNs

First off, let me explain what an ASN is. ASN stands for Autonomous System Number, which basically represents the identification number of a collection of networks. ![ASN](https://i.imgur.com/FCmAyj5.png)

Some ASNs are known for their lack of trustworthiness and common usage by bad actors, while some ASNs are simply too large to be able to catch every person who misuses their services. A good example is Digital Ocean, which has been blamed in multiple instances for various issues. Here's a short list:

*   [Massive Brute Force Attacks Originating from DigitalOcean IPs, Anyone Else Noticing This?](https://www.reddit.com/r/digital_ocean/comments/1h81q4m/massive_brute_force_attacks_originating_from/)
*   [Thoughts on blocking Digital Ocean, Mailchimp and other problem Servers](https://community.spiceworks.com/t/thoughts-on-blocking-digital-ocean-mailchimp-and-other-problem-servers/816379)
*   [Digital Ocean IP’s being blacklisted by more and more ESP’s](https://discourse.mailinabox.email/t/digital-ocean-ips-being-blacklisted-by-more-and-more-esps/8502)

So, what should you do about it, and how can you know which ASNs actually have ill intentions and which are just undermanaged?

A good resource to start with is [brianhama's bad-asn-list](https://github.com/brianhama/bad-asn-list), which isn't perfect but is an amazing start.

You shouldn't outright block ALL the ASNs from this list; however, you can make your firewall more careful and strict when it comes to them.

### 2. Filtering out suspicious packets

As I said in the beginning, there are networks that allow IP Header Modification, but what does that mean?

**IP Header Modification** means changing parts of an IP packet's header, like the source or destination IP, TTL, or protocol type.

Original packet:  
`Src IP: 192.168.1.10 → Dst IP: 8.8.8.8`

Modified packet:  
`Src IP: 10.0.0.1 → Dst IP: 8.8.8.8`

These days, this is rarely used for non-malicious intent and is rather used by bad actors to circumvent firewalls like [OVH's VAC](https://www.ovhcloud.com/en/security/anti-ddos/).

So, how can you stop that?

Some common signs are:

*   High traffic from random or fake IPs
*   Lots of TCP SYNs, no ACKs (incomplete handshakes)
*   Inconsistent or strange TTL values
*   Spoofed IPs don’t respond to pings
*   Sudden traffic spikes

A very easy, but also easy to circumvent, solution is to enable reverse path filtering.

On Linux, it's done with a simple `sysctl -w net.ipv4.conf.all.rp_filter=1`. However, with a good list of IPs to spoof to, this is not enough when it comes to an attacker who knows what they're doing. You need to look through traffic dumps. After a bit of experience, some downtime, and no access to a proper system like a Fortigate, I've come up with a bash script. It's not perfect, I wouldn't even call it great, but it's good enough for a lot of situations.

```bash
#!/bin/bash

# Interface to monitor
IFACE="eth0"
# SYN threshold per minute (tune as needed)
THRESHOLD=100
TMP_FILE="/tmp/syn_count.txt"

echo "[*] Capturing SYN packets for 60 seconds..."
sudo timeout 60 tcpdump -n -i "$IFACE" 'tcp[tcpflags] == tcp-syn' -l |
  awk '{print $3}' | cut -d. -f1-4 | sort | uniq -c > "$TMP_FILE"

echo "[*] Checking for suspicious IPs..."
while read -r count ip; do
  if (( count > THRESHOLD )); then
    echo "[!] Suspicious IP detected: $ip ($count SYNs)"
    # Optional: block with iptables
    # sudo iptables -A INPUT -s "$ip" -j DROP
  fi
done < "$TMP_FILE"

rm -f "$TMP_FILE"
```

you can just make this run periodically with a cron job.

# 3. Healthy rate-limiting

The term rate-limiting is self-explanatory: it limits how many requests a certain IP address can make in a specific time window.

For rate limiting, there is no one-size-fits-all solution for every case. However, there is a tool that fits in all cases, and that is **fail2ban** (note: yes, there are other tools, but I find fail2ban the most user-friendly).

In most cases, people use it for rate-limiting HTTP/HTTPS attacks. For an HTTP server run using nginx, you can use this config as a starter:

```ini
[nginx-http-auth]
enabled = true
port    = http,https
filter  = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 10
bantime  = 600
```

This limits to 5 requests every 10 seconds, and if an IP passes this limit, it gets banned for 10 minutes. You will most likely need to tweak this so you do not falsely flag actual users (for example, for a web store, this is way too low).

Another thing to check (if running an nginx server) is to rate-limit resource-intensive things like PHP, which is easy to do. Here's a short guide:

1.  Make a rate limit zone in your `/etc/nginx/nginx.conf`

```nginx
http {
  limit_req_zone $binary_remote_addr zone=php_limit:10m rate=5r/s; # this means 5 requests per second

  server {
    ...
  }
}
```

2.  Use that rate limit zone in your PHP location block

```nginx
server {
  location ~ \.php$ {
    limit_req zone=php_limit burst=10 nodelay;
    
    include fastcgi_params;
    fastcgi_pass unix:/run/php/php8.1-fpm.sock;  # adjust PHP version
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  }
}
```

# 4. Access to AbuseDB

What is AbuseDB?

AbuseDB is a public database of reported malicious IP addresses, like those used for DDoS, spam, port scans, and attacks. AbuseIPDB (AbuseDB) is a public database of reported malicious IP addresses.

Having access to this is amazing, however their free plan is limited to 1000 IP checks daily, which you will quickly find out is not enough. **HOWEVER**, if you still want to try it out, here's a fail2ban config you can try:

```ini
[Definition]
actionstart = 
actionstop = 
actioncheck = 
actionban = curl -G https://api.abuseipdb.com/api/v2/report \
    --data-urlencode "ip=<ip>" \
    --data-urlencode "categories=18" \
    --data-urlencode "comment=Fail2Ban ban" \
    -H "Key: YOUR_API_KEY" \
    -H "Accept: application/json"

actionunban =
```

Then you just link it to your fail2ban jail:

```ini
[sshd]
enabled = true
action = abuseipdb
```

### "I'm lazy, I want something ready to go!"

If you are lazy and want something ready to go, you should really check out highly praised Anti-DDoS services like [TCPShield](https://tcpshield.com/) and [NeoProtect](https://neoprotect.net/) (none of them sponsored me in any way, but from my experience with and against them, they are truly wonderful). You can also find hosting providers that already use NeoProtect. Here's a link to one of them owned by a friend of mine, it's called [BanatSync](https://banatsync.com/).

### What should you take from this post?

DDoS these days is hard to manage yourself and very much a cat-and-mouse game. There's no correct or wrong solution; it's just a matter of which one does better. However, you should remember this pyramid if you want to build your own anti-DDoS:

![pyramid of firewalls](https://i.imgur.com/o3ebfXk.png)