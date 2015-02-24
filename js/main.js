/**
 * Created by anderson.mota on 20/02/2015.
 */
var BookmarksToPocket = function($) {

    var appHost = "https://chrometopocket-anderson-mota.c9.io/";
    var pocketHost = "https://getpocket.com/";
    var pocketConsumerKey = "38238-3a41f1da78d6970fe24870f8";
    var pocketCode = "ea702271-f5b5-55ef-e47c-2fffff";
    var pocketAccessToken;
    var bookmark = {};
    var bookmarks = [];
    var bookmarksAdded = [];

    document.getElementById("inputImporter").addEventListener("change", handleFileSelect, false);

    $.fn.makeTags = function(tags) {
        tags = tags || [];

        var $parent = $(this).parent('dl');

        if (!$parent.length) {
            return tags;
        }

        var $tagSelector = $parent.prev('h3');

        if ($tagSelector.length) {
            var tagText = $tagSelector.first().text();
            if (tagText != "Barra de favoritos") {
                tags.push(tagText);
            }
        }

        return $parent.parent('dt').makeTags(tags);
    };

    function parseBookmarksToJson() {
        var source = new DOMParser().parseFromString(this.result, "text/html");
        console.log(source);
        console.log('title> ', $(source).find('title').length, $(source).find('title').text());

        $(source).find('dt').each(function() {
            console.log('dt>', $(this));

            if ($(this).find('a').length) {
                bookmark = {};
                bookmark.title = $(this).find('a').first().text();
                bookmark.url = $(this).find('a').first().attr('href');
                bookmark.time = $(this).find('a').first().attr('add_date');
                bookmark.tags = $(this).makeTags();

                console.log('title>', bookmark.title);
                console.log('url>', bookmark.url);
                console.log('tags>', bookmark.tags.join(', '));
                
                bookmarks.push(bookmark);
            }
        });
        
        saveBookmarks();
    }

    function handleFileSelect(e) {
        var files = e.target.files[0];
        var reader = new FileReader();
        reader.onloadend = parseBookmarksToJson;
        if (files) {
            reader.readAsText(files);
        }
    }
    
    function saveBookmarks() {
        pocketOAuthAuthorize().done(function(){
            if (!pocketAccessToken) { 
                console.error("Not defined pocketAccessToken, pocket not authorized.");
                return;
            }
            $.each(bookmarks, pocketAdd);
        });
    }

    function setPocketCode(data) {
        console.log('response oauth request: ', data);
        pocketCode = data.code;
        console.log('set> pocketCode: ', pocketCode);
    }

    function setAccessToken(data) {
        pocketAccessToken = data;
        console.log('set> pocketAccessToken', pocketAccessToken);
    }
    
    /**
    /* Pocket Functions
    */

    //@TODO Access-Control-Allow-Origin, need redirect_uri and need Request by server side
    function pocketOAuthRequest() {
        return $.ajax({
            type: 'post',
            contentType: 'application/json; charset=UTF-8',
            url: pocketHost + 'v3/oauth/request',
            data: {"consumer_key": pocketConsumerKey, "redirect_uri": appHost},
            success: setPocketCode
        });
    }

    //@TODO Access-Control-Allow-Origin, need redirect_uri and need Request by server side
    function pocketAuthorization() {
        return $.ajax({
            type: 'get',
            url: pocketHost + "auth/authorize",
            data: {request_token: pocketCode, redirect_uri: appHost},
            success: pocketViewAuthorization
        });
    }

    function pocketViewAuthorization(html) {
        console.log('show> Authorization Screen');
        $("#content").html(html);
    }

    //@TODO Access-Control-Allow-Origin, need request by server side
    function pocketOAuthAuthorize() {
        console.log('call> BookmarksToPocket:pocketOAuthAuthorize');
        return $.ajax({
            type: 'post',
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            url: pocketHost + 'v3/oauth/authorize',
            data: {"consumer_key": pocketConsumerKey, "code": pocketCode},
            success: setAccessToken
        });
    }
    
    function pocketAdd(bookmark) {
        var data = bookmark;
        $.ajax({
            type: 'post',
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8',
            url: pocketHost + "v3/add",
            data: $.extend(data, {"consumer_key": pocketConsumerKey, "access_token": pocketAccessToken}),
            success: function(data) {
                if (data.status) {
                    bookmarksAdded.push(bookmark);
                }
            }
        });
    }

    return {
        handleAuthorize: function() {
            console.log('call> BookmarksToPocket:handleAuthorize');
            pocketOAuthAuthorize();
        }
    };
}(jQuery);