// ==UserScript==
// @name         Star Thumbnail Expando
// @resource     STYLE  https://rawgit.com/somebody1234/star-thumn/master/style.css
// @version      0.3.4
// @match        *://chat.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @match        *://chat.meta.stackexchange.com/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

window.addEventListener('load', function() {
    'use strict';

    var cssTxt  = GM_getResourceText ("STYLE");
    GM_addStyle (cssTxt);


    var stars = document.getElementById('starred-posts');
    var thumbs = document.createElement('div');
    thumbs.id = 'thumbs';
    stars.appendChild(thumbs);

    if (!String.prototype.includes) {
        String.prototype.includes = function(needle) {
            return this.indexOf(needle) !== -1;
        };
    }

    function xhr(url, method, data) {
        data = data || {};
        method = method || "GET";

        var serialize = function(obj) {
            return Object.keys(obj).map(function(key) {
                return key + '=' + obj[key];
            }).join('&');
        };
        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.onload = function() { resolve(req.responseText); };
            req.onerror = reject;

            req.open(method, url);

            if (method !== 'GET') {
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            req.send(serialize(data));
        });
    }

    function isOnebox(msgId) {
        return xhr('/message/' + msgId, 'POST', {plain: true})
            .then(function(response) {
                //          vvvvvvvvvvvvvv just URL vvvvvvvvvvvvvvv vvvvvvvvvvvvvvvvv just linked image vvvvvvvvvvvvvvvvv
                return /^(?:!?https?:\/\/[^ ]+\.(?:jpe?g|png)|\[[^]]+\]\(!?https?:\/\/[^ ]+\.(?:jpe?g|png)\))$/.test(response);
            });
    }

    function isLiOnebox(li) {
        return isOnebox(li.id.replace('summary_', ''));
    }

    function lightbox(e) {
        e.preventDefault();
        e.stopPropagation();
        var lightboxImage = document.getElementById('lightbox-image'),
            lightboxContainer = document.getElementById('lightbox-container');
        if (!lightboxImage) {
            lightboxContainer = document.createElement('div');
            lightboxContainer.id = 'lightbox-container';
            var lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightboxImage = document.createElement('img');
			lightboxImage.id = 'lightbox-image';
            lightboxImage.addEventListener('click', function () {
                lightboxImage.classList.toggle('zoomed');
            });
            lightboxContainer.addEventListener('click', function(e) {
                if (e.target !== lightboxImage) {
                    lightboxContainer.style.display = 'none';
                }
            });
            var filler1 = document.createElement('div'),
                filler2 = document.createElement('div');
            filler1.classList.add('filler');
            filler2.classList.add('filler');
            lightbox.appendChild(lightboxImage);
            lightboxContainer.appendChild(filler1);
            lightboxContainer.appendChild(lightbox);
            lightboxContainer.appendChild(filler2);
            document.body.appendChild(lightboxContainer);
        }
        lightboxContainer.style.display = 'flex';
        lightboxImage.src = e.target.parentElement.href;
        return true;
    }

    function toThumbnail(li) {
        // Purely so that the current scripts won't break!
        var newLi = document.createElement('li');
        newLi.id = li.id;

        var figure = document.createElement('figure');

        var imgA = li.querySelector('a').cloneNode(true);
        var starSpan = li.querySelector('span').cloneNode(true);
        var menuSpan = li.querySelector('.quick-unstar').cloneNode(true);

        var voteSpan = starSpan.querySelector('.img.vote');
        voteSpan.textContent = starSpan.classList.contains('owner-star') ? '✪' : '★';
        voteSpan.classList.remove('img');

        var img = new Image();
        if (imgA.href.includes('googledrive.com')) {
            var hasThumb = imgA.href.includes('_thumb');
            if (hasThumb) {
                img.src = imgA.href;
                imgA.href = imgA.href.replace('_thumb', '');
            }
            else {
                img.src = imgA.href.replace(/\.[^.]+$/, '_thumb$&');
            }
        }
        else if (imgA.href.includes('i.imgur.com') || imgA.href.includes('i.stack.imgur.com')) {
            img.src = imgA.href.replace(/\.[^.]+$/, 't$&');
        }
        else {
            img.src = imgA.href;
        }

        img.addEventListener('click', lightbox);

        //         Not dots! This is a single character! vvv
        if (!imgA.href.includes(imgA.textContent.replace('…', ''))) { imgA.title = imgA.textContent; }
        imgA.textContent = '';

        imgA.appendChild(img);
        figure.appendChild(imgA);
        figure.appendChild(starSpan);
        figure.appendChild(menuSpan);

        newLi.appendChild(figure);

        return newLi;
    }

    function emptyElement(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function renderAllThumbnails() {
        emptyElement(thumbs);

        var thumbnailWorthy = [].filter.call(stars.querySelectorAll('a'), function justThoseWithImageLinks(link) {
            return /(?:jpe?g|png)$/.test(link.href);
        })
        .map(function getParent(link) {
            return link.parentNode;
        });
        Promise.all(thumbnailWorthy)
            .then(function(thumbnailWorthyArray) {
                return thumbnailWorthyArray.filter(isLiOnebox);
            })
            .then(function prepareGround(confirmedThumbnails) {
                confirmedThumbnails.forEach(function(li) {
                    li.classList.add('hidden');
                });
                return confirmedThumbnails;
            })
            .then(function(confirmedThumbnails) {
                return confirmedThumbnails.map(toThumbnail);
            })
            .then(function(images) {
                images.forEach(thumbs.appendChild.bind(thumbs));
            });
    }

    (new MutationObserver(renderAllThumbnails))
        .observe(stars.parentNode, {childList: true, subTree: true, characterData: true, attributes: true});

    setTimeout(renderAllThumbnails, 0);

});
