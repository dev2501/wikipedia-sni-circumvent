/*
 * Copyright (C) 2019 dev2501
 *
 * This program is free software: you can redistribute and/or modify it
 * under the terms of the following OpenBSD license. However, the program
 * uses "wall.svg" as its logo, which is released by Google under the
 * Apache License v2. See LICENSE for full terms and conditions.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

var WIKIPEDIA_ROOT = "https://wikipedia.org/censorship-circuvention/";
var WIKIPEDIA_ROOT_WWW = "https://www.wikipedia.org/censorship-circuvention/";

/* Unix timestamp of the last request */
var last_rewrite = 0.0;

/*
 * Generate a random 16-digit string.
 *
 * According to the Birthday Paradox, the chance of collusion is 1/sqrt(10^16),
 * or ~1/10^8. This should be enough for everyone but time travelers.
 */
function random()
{
    var rnd = new Uint8Array(16);
    for (var i = 0; i < 16; i++) {
        rnd[i] = Math.random() * 10;
    }
    return rnd.join("");
}

function listener(details)
{
    if (details.url.includes(WIKIPEDIA_ROOT_WWW)) {
        console.log("wikipedia-sni: allow intermediate " + details.url);
        /* allow it to proceed! */
    }
    else if (details.url.includes(WIKIPEDIA_ROOT)) {
        /* do not intercept ourself */
        console.log("wikipedia-sni: ignore recursion " + details.url);
        return {};
    }
    else if (details.url.includes("http://")) {
        /* redirect to HTTPS */
        console.log("wikipedia-sni: HTTPS upgrade " + details.url);
        return {redirectUrl: details.url.replace("http://", "https://")};
    }
    else if (Date.now() - last_rewrite < 60000) {
        /* ignore any repeated requests */
        console.log("wikipedia-sni: ignore recent " + details.url);
        return {};
    }

    /* start proceed request */
    last_rewrite = Date.now();
    return listener_tricky(details);
}

/*
 * Our simple request handler.
 *
 * This is the simplest and fastest implementation of censorship circuvention.
 * We intercept all connections to Wikipedia and block the request for a while,
 * until we've fetched https://wikipedia.org/censorship-circuvention. At that
 * time, the TLS session is already established. Then, we allow the request to
 * continue.
 *
 * But it doesn't work if first-party isolation is enabled! If FPI is enabled,
 * session data from different origins is isolated. This includes cookies,
 * local storage, TLS cache, HSTS preloading, etc, and offers a good protection
 * for privacy. However, the TLS session in our plugin will be isolated as well,
 * if we've fetched Wikipedia here, it won't have any effect to the user's tab!
 *
 * XXX: This function is DISABLED and NOT USED, and it has been replaced by
 * listener_tricky() due to the reason above. Also, this function has a bug:
 * it does not resolve() if fetch() fails, leaving the tab loading forever,
 * but not worth fixing.
 *
 * This function is left here only as a technical reference to the readers.
 * Please see listener_tricky().
 */
function listener_simple(details)
{
    console.log("wikipedia-sni: intercept " + details.url);

    /*
     * webRequest will block this request to Wikipedia until this Promise
     * resolve().
     */
    var async_request = new Promise((resolve, reject) =>
    {
        console.log(Date.now() + " async request");
        
        fetch(WIKIPEDIA_ROOT, {
                redirect: "manual"
            }
        ).then(function(response) {
                console.log(Date.now() + " async resolve");
                resolve({});
        });

    });
    return async_request;
}

/*
 * Our tricky request handler.
 *
 * This is a more tricky implemenatation of censorship circuvention. However,
 * it's compatible with First-Party Isolation, which is crucial for user's
 * privacy.
 *
 * Same as the fast handler, we intercept all connections to Wikipedia. But
 * instead of blocking it and fetching Wikipedia in our plugin, we redirect
 * the request to https://wikipedia.org/censorship-circuvention/$(random_id).
 * We store the original target the user wanted to visit and its random ID
 * in a hash table.
 *
 * Later on, the browser will fetch it, and will receive a "301 redirect" to
 * https://www.wikipedia.org/censorship-circuvention/$(random_id). We intercept
 * this request again, and redirect the user to the original target according
 * to $(random_id) in the hash table.
 *
 * In this way, by playing this Ping-Pong game, the fetch would be done by
 * the browser, not by us, so our session will not be blocked by the first-
 * party isolation!
 */

var table = new Object();

function listener_tricky(details)
{
    if (!details.url.includes(WIKIPEDIA_ROOT_WWW)) {
        console.log("wikipedia-sni: intercept " + details.url);

        var random_id = random();
        table[random_id] = details.url;
        return {redirectUrl: WIKIPEDIA_ROOT + random_id};
    }
    else {
        console.log("wikipedia-sni: restore " + details.url);

        var random_id = details.url.replace(WIKIPEDIA_ROOT_WWW, "");
        var ret = {redirectUrl: table[random_id]};
        delete table[random_id];
        return ret;
    }
}

/*
 * Install our hook to intercept requests to Wikipedia.
 */
browser.webRequest.onBeforeRequest.addListener(
    listener,
    {urls: ["*://*.wikipedia.org/*"]},
    ["blocking"]
);

/*
 * TODO: If the Wikipedia domains are hijacked or don't point to the same
 * IP address, this plugin won't work. We should probe them and double check,
 * and display a big error message from the GUI icon to notify the user if
 * an incorrect IP address is received by the browser.
 */
