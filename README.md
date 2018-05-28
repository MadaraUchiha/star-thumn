<kbd>[install]</kbd>

## Description

This is a userscript for StackExchange chat. It replaces all direct links to images in starred messages widget with thumbnails of said images.

![before after]

It also shows the star counter on hover and allows you to star/unstar images.

![animated gif]

And shows a lightbox when any image is clicked.

![lightbox]


## Current features:

 - Oneboxed images in chat will become thumbnails.
 - Add or remove stars normally. The star button appears on hover.
 - Linked images in the form of `[text](image link)` (assuming nothing else on the message) will become thumbnails with `text` being a `title` on the image.
 - Proper thumbnailing for imgur images.
 - Clicking on images will open a lightbox.


## Planned features:

 - Accepting suggestions in answers below.


## Install

You can find the repository that holds the code **[can be found here][repo]**. To install, you must be able to run userscripts. Chrome does this by default (or with Tampermonkey) and Firefox does this with Greasemonkey.


## Extra
Please note that this is still under development, and not all features are guaranteed to work properly.


  [install]: https://github.com/MadaraUchiha/star-thumn/raw/master/expando.user.js
  [before after]: http://i.stack.imgur.com/GA1oC.png
  [animated gif]: http://i.stack.imgur.com/A0I18.gif
  [lightbox]: https://i.imgur.com/N5oGBpp.gif
  [repo]: https://github.com/MadaraUchiha/star-thumn
