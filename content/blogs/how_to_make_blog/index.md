---
title: "How to make a blog!"
commentsId: "Blogs: How to make a blog!"
summary: "Details on how to make a blog similar to this one and my journey getting here!"
description: "Details on how to make a blog similar to this one and my journey getting here!"

draft: true
date: 2025-05-27 # follow the Y/M/D format 

categories: [blog]
tags: [guide, tech]
# series: []
# series\_order: 

authors:
  - talha
---

## The idea

Its not entirely accurate to say that this website is a blog. I think I would describe it more as a creative space.

## Site Architecture

The site architecture is relatively straight forward and followed a clear line of logic.

At the very beginning I started with limiting myself to using Static Site Generator \(SSG\). I chose SSG because my site does not need any dynamic functionality allowing me to minimize bloat and potential security vulnerabilities that comes with shipping a dynamic site filled with Javascript \(also JS sucks lol\). I am of the strong opinion that much of the modern web today is both ridiculously over engineered and bloated.

When it came to choosing which SSG I wanted to use I naturally drifted towards Hugo. My brother had recommended Hugo to me which had previously peaked my curiosity in it. Hugo being blazingly fast with a plethora of themes to choose from was the cherry on top.

I am using the Blowfish theme for website. I find the sheer amount of functionality and easy customizability Blowfish gives out of the box staggering. Blowfish is probably the most comprehensive theme out there and I highly recommend using it.

Some other key features that were important to me that led into the Hugo Blowfish powered site are:

- **Markdown support and simplicity:** This is absolutely crucial because I am not a front end developer nor do I have the desire to be one. I do not want to spend my time learning a front end framework, HTML, and CSS in earnest. It provides very little value with huge time sink; an opportunity cost I simply couldn't justify. That is why Hugo is great. It bypasses the need to learn HTML or CSS by allowing me to write beautiful pages in Markdown only for the most part. Hugo itself is very straightforward and you could easily pick it up in a day and start making your own site that looks like you spent way more time on it then you actually did \(what are you waiting for! Don't just read this go do it!\).

- **Comments:** To me comments are important. I want to be able to harass my brothers to glaze me on my website. There is a very clever solution \(Giscus - link it\) for comments that uses Git Hubs built in discussion board, allowing you to avoid connecting a database. I did consider things like the ability to leave likes and count views on each page but that required a database, introduced complexity and potential maintenance which didn't seem worth my time, leading me to my next point \(although liking functionality is sort of covered by Giscus reaction feature\).

- Ease of maintenance and maintainability: I want to spend a chunk of time once setting everything up how I want it and not have to worry about things breaking, maintenance, etc. SSG allows me to keep it simple with very little room for things to break. Also Hugo and Blowfish are driven by an active community and I don't expect either to die anytime soon, so I will benefit from routine patches and feature updates.

- Looks good: Lastly, the site needs to look good. I will say the early 2000's raw HTML and CSS website definitely have their charm \( also I swear to god the always happen to be the most goated resource for whatever you are looking for\) but I wanted something a little snazzier. Needless to say Blowfish knocks the socks off!!

Having covered what and why I am using to power my site, lets talk about hosting. I am using Cloudflare Pages to host my site. The primary reason I went with Cloudflare for hosting is that I found it to be a one stop shop for me. I use them to rent my domain name and host my site. Hosting a static site like this with Cloudflare Pages is also free, so the fact that I could register my domain name with was the cherry on top. Also personally I find it a bit easier to use then GitHub Pages in terms of straight deployment, but a little more annoying to create workflows with. Also Cloudflares has the potential to integrate Content Delivery Networks CDN, gives DDos protection out the box, and acts a reverse proxy for extra security. Its pretty great.

My title was kind of click bait because I'm not actually going to go over how to make a blog, I just wanted to yap. Instead I think you should checkout Blowfish's documentation (LINK THIS HERE) itself as it will stay up to date with any changes they make to the process while my blog probably wont.

But I do want to quickly talk about how to add comments since they are the slightest big confusing in my opinion

## Adding Comments via Giscus
