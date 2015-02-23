/**
 * Created by anderson.mota on 20/02/2015.
 */
var BookmarksToPocket = function($) {

    var appHost = "http://chrome-bookmarks-to-pocket.herokuapp.com/";
    var pocketHost = "https://getpocket.com/";
    var pocketCustomerKey = "38238-3a41f1da78d6970fe24870f8";
    var pocketCode, pocketAccessToken;
    var bookmarks = {};

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

    function init() {
        console.log('call> BookmarksToPocket:pocketOAuthRequest');
        pocketOAuthRequest();
    }

    function parseBookmarksToJson() {
        var source = new DOMParser().parseFromString(this.result, "text/html");
        console.log(source);
        console.log('title> ', $(source).find('title').length, $(source).find('title').text());

        $(source).find('dt').each(function() {
            console.log('dt>', $(this));

            if ($(this).find('a').length) {
                var title = $(this).find('a').first().text();
                var url = $(this).find('a').first().attr('href');
                var tags = $(this).makeTags();

                console.log('title>', title);
                console.log('url>', url);
                console.log('tags>', tags.join(', '));
            }
        });
    }

    function handleFileSelect(e) {
        var files = e.target.files[0];
        var reader = new FileReader();
        reader.onloadend = parseBookmarksToJson;
        if (files) {
            reader.readAsText(files);
        }
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

    //@TODO Access-Control-Allow-Origin need redirect_uri
    function pocketOAuthRequest() {
        $.ajax({
            type: 'post',
            url: pocketHost + 'v3/oauth/request',
            data: {"consumer_key": pocketCustomerKey, "redirect_uri": appHost},
            success: setPocketCode
        });
    }

    //@TODO Access-Control-Allow-Origin need redirect_uri
    function pocketAuthorization() {
        $.ajax({
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

    function pocketOAuthAuthorize() {
        console.log('call> BookmarksToPocket:pocketOAuthAuthorize');
        $.ajax({
            type: 'post',
            dataType: 'json',
            url: pocketHost + 'v3/oauth/authorize',
            data: {"consumer_key": pocketCustomerKey, "code": pocketCode},
            success: setAccessToken
        });
    }


    //code=2d838e69-1d84-e209-73af-ae88b8
    //access_token=df7cee47-1c24-6e83-3d46-2ce2bb&username=anderson.mota

    init();

    return {
        handleAuthorize: function() {
            console.log('call> BookmarksToPocket:handleAuthorize');
            pocketOAuthAuthorize();
        }
    }
}(jQuery);