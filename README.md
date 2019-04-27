# Wikipedia SNI Censorship Circuvention

Recently, the Great Firewall of China has deployed complete DNS-based and
SNI-based censorship. Modifying /etc/hosts or encrypting the DNS alone is
no longer enough. This Firefox Addon helps to bypass the SNI-part of the
censorship.

## How To Use

**1. You must modify /etc/hosts, or this Addon won't work!** To make
the circuvention possible, you need to add the following items.

    # You should add one item for each language edition you
    # want to visit. In this example, English, Chinese and
    # Japanese Wikipedia have been added. If you want to access
    # other languages, you should add them to the list.

    # Wikipedia has multiple IP addresses. You can use any one
    # of them, the following is just an example, as long as you
    # are using the same IP address for all domains, it should work.

    91.198.174.192  wikipedia.org
    91.198.174.192  www.wikipedia.org
    91.198.174.192  en.wikipedia.org
    91.198.174.192  zh.wikipedia.org
    91.198.174.192  ja.wikipedia.org

Alternatively, for advanced users who are already using their own DNS
resolver, you can also make use of your own DNS server to achieve the
same effect as above.

**2. Once you've modified /etc/hosts, restart Firefox.**

This step is important to remove all the existing DNS cache in Firefox.

**3. Install this plugin.**

Download:

https://github.com/dev2501/wikipedia-sni-circumvent/releases/download/0.1.1/wikipedia-sni-circumvent.xpi

April, 2019

dev2501
