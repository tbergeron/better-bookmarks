Vue.debug = true;

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

window.onload = function() {
    document.getElementById('searchQuery').focus();

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var currentUrl = tabs[0].url
        var currentTitle = tabs[0].title

        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid;
            if (userid) {
                useToken(userid);
            } else {
                userid = getRandomToken();
                chrome.storage.sync.set({userid: userid}, function() {
                    useToken(userid);
                });
            }
            function useToken(userid) {

                var baseURL = 'https://bbtestdb.firebaseio.com/'
                var Bookmarks = new Firebase(baseURL + userid + '/bookmarks')

                Bookmarks.on('child_added', function(snapshot) {
                    var item = snapshot.val()
                    item.id = snapshot.key()
                    app.bookmarks.push(item)
                })

                Bookmarks.on('child_removed', function(snapshot) {
                    var id = snapshot.key()
                    app.bookmarks.some(function(bookmark) {
                        if (bookmark.id === id) {
                            app.bookmarks.$remove(bookmark)
                            return true
                        }
                    })
                })
                
                var app = new Vue({
                    el: '#app',
                    searchQuery: '',
                    data: {
                        bookmarks: [],
                        newBookmark: {
                            name: currentTitle,
                            url: currentUrl
                        }
                    },
                    // computed property for form validation state
                    computed: {
                        validation: function() {
                            return {
                                name: !!this.newBookmark.name.trim(),
                                url: !!this.newBookmark.url.trim(),
                            }
                        },
                        isValid: function() {
                            var validation = this.validation
                            return Object.keys(validation).every(function(key) {
                                return validation[key]
                            })
                        },
                    },
                    // methods
                    methods: {
                        addBookmark: function() {
                            if (this.isValid) {
                                Bookmarks.push(this.newBookmark)
                                this.newBookmark.name = ''
                                this.newBookmark.url = ''
                            }
                        },
                        removeBookmark: function(bookmark) {
                            return Bookmarks.child(bookmark.id).remove()
                        },
                        bookmarkCurrentPage: function() {
                            Bookmarks.push({
                                name: currentTitle,
                                url: currentUrl
                            })
                        }
                    }
                }) // end of vue App

            }
        });
    });
}