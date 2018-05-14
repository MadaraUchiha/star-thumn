## Description

This is a userscript for StackExchange chat. It replaces all direct links to images in starred messages widget with thumbnails of said images.

![screenshot](http://i.stack.imgur.com/GA1oC.png)

It also shows the star counter on hover and allows you to star/unstar images.

![animated gif](http://i.stack.imgur.com/A0I18.gif)


## Current features:

 - Oneboxed images in chat will become thumbnails.
 - Add or remove stars normally. The star button appears on hover.
 - Linked images in the form of `[text](image link)` (assuming nothing else on the message) will become thumbnails with `text` being a `title` on the image.
 - Images from `googledrive.com` will be properly thumbnailed with the `_thumb` suffix. Link will lead to full size image. *(This is [a thing](https://meta.anime.stackexchange.com/questions/1161/chat-has-pictures-and-they-are-big) specific to our chat room.)*


## Planned features:

 - Proper thumbnailing for imgur images (use the `s` or `m` suffix to save bandwidth)
 - Accepting suggestions in answers below.

## Install

You can find the repository that holds the code **[can be found here][3]**. To install, you must be able to run user scripts. Chrome does this by default (or with Tampermonkey) and Firefox does this with Greasemonkey.

### *[CLICK HERE TO INSTALL][4]*


## Extra
Please note that this is still under development, and not all features are guaranteed to work properly.


  [1]: http://i.stack.imgur.com/p1SB7.png
  [2]: http://i.stack.imgur.com/A0I18.gif
  [3]: https://github.com/somebody1234/star-thumn
  [4]: https://github.com/somebody1234/star-thumn/raw/master/expando.user.js
