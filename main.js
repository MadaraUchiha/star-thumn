(function(){window.addEventListener('load', function() {
    'use strict';

    let stars = document.getElementById('starred-posts');
    let thumbs = document.createElement('div');
    thumbs.id = 'thumbs';
    stars.appendChild(thumbs);

    function xhr(url, method, data) {
        data = data || {};
        method = method || "GET";

        let serialize = function(obj) {
            return Object.keys(obj).map(function(key) {
                return key + '=' + obj[key];
            }).join('&');
        };
        return new Promise(function(resolve, reject) {
            let req = new XMLHttpRequest();
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
                return /^(?:!?https?:\/\/[^ ]+\.(?:jpg|png|gif|svn)|\[[^]]+\]\(!?https?:\/\/[^ ]+\.(?:jpg|png|gif|svn)\))$/.test(response);
            });
    }

    function isLiOnebox(li) {
        return isOnebox(li.id.replace('summary_', ''));
    }

    let thumbnailWorthy = [].filter.call(stars.querySelectorAll('a'), function(link) {
        return /(?:jpg|png|gif|svn)$/.test(link.href);
    })
    .map(function getParent(link) {
        return link.parentNode;
    })

    function toThumbnail(li) {
        // Purely so that the current scripts won't break!
        let newLi = document.createElement('li');
        newLi.id = li.id;

        let figure = document.createElement('figure');

        let imgA = li.querySelector('a');
        let starSpan = li.querySelector('span');

        let img = new Image();
        img.src = imgA.href;
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';

        figure.appendChild(img);
        figure.appendChild(starSpan);

        newLi.appendChild(figure);

        return newLi;
        return li; // Todo
    }
    
    Promise.all(thumbnailWorthy)
        .then(function(thumbnailWorthyArray) {
            return thumbnailWorthyArray.filter(isLiOnebox);
        })
        .then(function prepareGround(confirmedThumbnails) {
            confirmedThumbnails.forEach(function(li) {
                li.parentNode.removeChild(li);
            });
            return confirmedThumbnails;
        })
        .then(function(confirmedThumbnails) {
            return confirmedThumbnails.map(toThumbnail);
        })
        .then(function(images) {
            images.forEach(thumbs.appendChild.bind(thumbs))
        })
        .then(console.log.bind(console));

});})();