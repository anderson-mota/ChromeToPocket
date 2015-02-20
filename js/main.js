/**
 * Created by anderson.mota on 20/02/2015.
 */
var App = function($) {

    var pocketHost = "https://getpocket.com/";
    var pocketCustomerKey = "38238-3a41f1da78d6970fe24870f8";
    var pocketCode, pocketAccessData;
    var bookmarks = {};

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

    document.getElementById("inputImporter").addEventListener("change", handleFileSelect, false);

    function setPocketCode(data) {
        pocketCode = data.code;
    }

    function setAccessData(data) {
        pocketAccessData = data
    }

    function pocketAuthenticate() {
        $.ajax({
            type: 'post',
            dataType: 'json',
            url: pocketHost + 'v3/oauth/request',
            data: {"consumer_key": pocketCustomerKey, "redirect_uri":"pocketapp1234:authorizationFinished"},
            success: setPocketCode
        });
    }

    //@TODO Step of user to authorization

    function pocketAuthorize() {
        $.ajax({
            type: 'post',
            dataType: 'json',
            url: pocketHost + 'v3/oauth/authorize',
            data: {"consumer_key": pocketCustomerKey, "code": pocketCode},
            success: setAccessData
        });
    }
    //code=2d838e69-1d84-e209-73af-ae88b8
    //access_token=df7cee47-1c24-6e83-3d46-2ce2bb&username=anderson.mota
}(jQuery);