// ==UserScript==
// @name         Star Thumbnail Expando
// @resource     STYLE  https://rawgit.com/somebody1234/star-thumn/master/style.css
// @version      0.3.12
// @match        *://chat.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @match        *://chat.meta.stackexchange.com/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(GM_getResourceText("STYLE"));

    var stars = document.getElementById('starred-posts').children[0],
        thumbs = document.createElement('div'),
        rendering = false;
    thumbs.id = 'thumbs';
    stars.appendChild(thumbs);

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
                //          vvvvvvvvvv just URL vvvvvvvvvvv v forced onebox v vvvvvvvvvvvvvv just linked image vvvvvvvvvvvvv
                return /^(?:https?:\/\/[^ ]+\.(?:jpe?g|png)|!https?:\/\/[^ ]+|\[[^]]+\]\(!?https?:\/\/[^ ]+\.(?:jpe?g|png)\))$/.test(response);
            });
    }

    function isLiOnebox(li) {
        return isOnebox(li.id.replace('summary_', ''));
    }

    function lightbox(e, img) {
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
        lightboxImage.classList.remove('zoomed');
        lightboxContainer.style.display = 'flex';
        lightboxImage.src = /\.[^/]+$/.test(e.target.parentElement.href) ? e.target.parentElement.href : e.target.src;
        return true;
    }

    function toThumbnail(li) {
        // Purely so that the current scripts won't break!
        var newLi = document.createElement('li');
        newLi.id = li.id;

        var figure = document.createElement('figure'),
            imgA = li.querySelector('a').cloneNode(true),
            starSpan = li.querySelector('span').cloneNode(true),
            menuSpan = li.querySelector('.quick-unstar').cloneNode(true);

        var voteSpan = starSpan.querySelector('.img.vote');
        voteSpan.textContent = starSpan.classList.contains('owner-star') ? '✪' : '★';
        voteSpan.classList.remove('img');

        var img = new Image();
        img.src = /i\.(?:stack\.)?imgur\.com/.test(imgA.href) ? imgA.href.replace(/\.[^.]+$/, 't$&') : imgA.href;
        img.addEventListener('click', function (e) { lightbox(e, img); });

        //       Not dots! This is a single character! vvv
        if (imgA.href.indexOf(imgA.textContent.replace('…', '')) !== -1) {
            imgA.title = imgA.textContent;
        }
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

    function renderAllThumbnails(mutations) {
        if (rendering || mutations && mutations.every(function (mutation) { return mutation.target.tagName !== 'UL'; })) {
            return;
        }
        rendering = true;
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
            }).then(function prepareGround(confirmedThumbnails) {
                confirmedThumbnails.forEach(function(li) { li.classList.add('hidden'); });
                return confirmedThumbnails;
            }).then(function(confirmedThumbnails) {
                return confirmedThumbnails.map(toThumbnail);
            }).then(function(images) {
                images.forEach(thumbs.appendChild.bind(thumbs));
            }).then(function() { rendering = false; });
    }

    (new MutationObserver(renderAllThumbnails)).observe(stars, {childList: true, attributes: true, subtree: true});

    setTimeout(renderAllThumbnails, 0);

    function addLightboxHandler(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            for (var j = 0; j < mutation.addedNodes.length; j++) {
                if (!mutation.addedNodes[j].querySelectorAll) {
                    continue;
                }
                var images = mutation.addedNodes[j].querySelectorAll('img');
                for (var k = 0; k < images.length; k++) {
                    images[k].addEventListener('click', lightbox);
                }
            }
        }
    }

    (new MutationObserver(addLightboxHandler)).observe(document.getElementById('chat'), {childList: true, attributes: true, subtree: true});

    setTimeout(function() {
        addLightboxHandler([{ type: 'childList', addedNodes: [].map.call(document.getElementsByClassName('user-image'), function (element) {
            return element.parentNode;
        })}]);
    }, 0);
})();
