// ==UserScript==
// @name         Star Thumbnail Expando
// @resource     STYLE  https://rawgit.com/MadaraUchiha/star-thumn/master/style.css
// @version      0.3.15
// @match        *://chat.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @match        *://chat.meta.stackexchange.com/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-idle
// @updateURL    https://rawgit.com/MadaraUchiha/star-thumn/raw/master/expando.user.js
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(GM_getResourceText('STYLE'));

    var $c = document.createElement.bind(document),
        stars = document.getElementById('starred-posts').children[0],
        thumbs = $c('div'),
        rendering = false;
    thumbs.id = 'thumbs';
    stars.appendChild(thumbs);

    function xhr(url, method, data) {
        method = method || 'GET';

        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.onload = function() { resolve(req.responseText); };
            req.onerror = reject;

            req.open(method, url);

            if (method !== 'GET') {
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            req.send((function serialize(obj) {
                return Object.keys(obj).map(function(key) {
                    return key + '=' + obj[key];
                }).join('&');
            })(data || {}));
        });
    }

    // from https://stackoverflow.com/a/47087343
    function returnImageIfExists(link) {
        return new Promise(function(resolve, reject) {
            var image = new Image();
            image.onload = () => resolve(link);
            image.onerror = () => resolve(null);
            image.src = link.href || link.src;
        });
    }

    function isLiOnebox(li) {
        return xhr('/message/' + li.id.replace('summary_', ''), 'POST', {plain: true})
            .then(function(response) {
                //          vvvvvvvvvv just URL vvvvvvvvvvv v forced onebox v vvvvvvvvvvvvvv just linked image vvvvvvvvvvvvv
                return /^(?:https?:\/\/[^ ]+\.(?:jpe?g|png)|!https?:\/\/[^ ]+|\[[^]]+\]\(!?https?:\/\/[^ ]+\.(?:jpe?g|png)\))$/.test(response);
            });
    }

    function lightbox(e, img) {
        // use all three methods to stop events (note: return true is one as well) just to be safe
        e.preventDefault();
        e.stopPropagation();
        var lightboxImage = document.getElementById('lightbox-image'),
            lightboxContainer = document.getElementById('lightbox-container');
        if (!lightboxImage) {
            lightboxContainer = $c('div');
            lightboxContainer.id = 'lightbox-container';
            var lightbox = $c('div');
            lightbox.id = 'lightbox';
            lightboxImage = $c('img');
			lightboxImage.id = 'lightbox-image';
            lightboxImage.addEventListener('click', () => lightboxImage.classList.toggle('zoomed'));
            lightboxContainer.addEventListener('click', function(e) {
                if (e.target !== lightboxImage) {
                    lightboxContainer.style.display = 'none';
                }
            });
            var filler1 = $c('div'),
                filler2 = $c('div');
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
        var newLi = $c('li');
        newLi.id = li.id;

        var figure = $c('figure'),
            imgA = li.querySelector('a').cloneNode(true),
            starSpan = li.querySelector('span').cloneNode(true),
            // this won't be here if logged out
            menuSpan = li.querySelector('.quick-unstar') ? li.querySelector('.quick-unstar').cloneNode(true) : null;

        var voteSpan = starSpan.querySelector('.img.vote');
        voteSpan.textContent = starSpan.classList.contains('owner-star') ? '✪' : '★';
        voteSpan.classList.remove('img');

        var img = new Image();
        img.src = /i\.(?:stack\.)?imgur\.com/.test(imgA.href) ? imgA.href.replace(/\.[^.]+$/, 't$&') : imgA.href;
        img.addEventListener('click', function (e) { lightbox(e, img); });

        //       Not dots! This is a single character! vvv
        if (imgA.href.includes(imgA.textContent.replace('…', ''))) {
            imgA.title = imgA.textContent;
        }
        imgA.textContent = '';

        imgA.appendChild(img);
        figure.appendChild(imgA);
        figure.appendChild(starSpan);
        if (menuSpan) {
            figure.appendChild(menuSpan);
        }

        newLi.appendChild(figure);

        return newLi;
    }

    function emptyElement(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function renderAllThumbnails(mutations) {
        if (rendering || mutations && mutations.every(mutation => mutation.target.tagName !== 'UL')) {
            return;
        }
        rendering = true;
        emptyElement(thumbs);

        var thumbnailWorthy = Array.from(stars.querySelectorAll('a:not(.permalink):not(:nth-last-child(2))')).filter(function justThoseWithImageLinks(link) {
            return (/(?:jpe?g|png)$/.test(link.href) || (!/^\/users\/\d+\//.test(link.href) && link.parentNode.childNodes[2].wholeText === '\n            !')) && isLiOnebox(link.parentNode);
        }).map(returnImageIfExists);
        Promise.all(thumbnailWorthy)
            .then(function(thumbnailWorthyArray) {
            return thumbnailWorthyArray.filter(link => link);
        }).then(function getParent(confirmedThumbnails) {
            return confirmedThumbnails.map(link => link.parentNode);
        }).then(function prepareGround(confirmedThumbnails) {
            confirmedThumbnails.forEach(li => li.classList.add('hidden'));
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
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!node.querySelectorAll)
                    continue;
                for (const image of node.querySelectorAll('img')) {
                    returnImageIfExists(image).then(function (result) {
                        if (!result) {
                            image.src = 'https://cdn-chat.sstatic.net/chat/img/ImageNotFound.png';
                        }
                    });
                    image.addEventListener('click', lightbox);
                }
            }
        }
    }

    (new MutationObserver(addLightboxHandler)).observe(document.getElementById('chat'), {childList: true, attributes: true, subtree: true});

    setTimeout(function() {
        addLightboxHandler([{ type: 'childList', addedNodes: Array.from(document.getElementsByClassName('user-image')).map(function (element) {
            return element.parentNode;
        })}]);
    }, 0);
})();
