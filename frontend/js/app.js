Vue.debug = true
var baseURL = 'https://bbtestdb.firebaseio.com/'

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32)
    crypto.getRandomValues(randomPool)
    var hex = ''
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16)
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex
}

window.onload = function() {
    $('#searchQuery').focus()

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var currentUrl = tabs[0].url
        var currentTitle = tabs[0].title

        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid
            if (userid) {
                useToken(userid)
            } else {
                userid = getRandomToken()
                chrome.storage.sync.set({userid: userid}, function() {
                    useToken(userid)
                })
            }
            function useToken(userid) {
                // logic starts here
                var Bookmarks = new Firebase(baseURL + userid + '/bookmarks')
                Bookmarks.on('child_added', function(snapshot) {
                    var item = snapshot.val()
                    item.id = snapshot.key()
                    app.bookmarks.push(item)
                })

                // Bookmarks.on('child_changed', function(snapshot) {
                //     console.log(snapshot);
                //     var item = snapshot.val()
                //     item.id = snapshot.key()
                //     app.bookmarks.push(item)
                // })

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
                    currentObjectInfo: [],
                    data: {
                        bookmarks: [],
                        bookmarkForm: {
                            name: currentTitle,
                            url: currentUrl
                        }
                    },
                    // computed property for form validation state
                    computed: {
                        validation: function() {
                            return {
                                name: !!this.bookmarkForm.name.trim(),
                                url: !!this.bookmarkForm.url.trim(),
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
                        editBookmark: function(bookmark) {
                            this.bookmarkForm.name = bookmark.name
                            this.bookmarkForm.url = bookmark.url
                            this.currentObjectInfo = [app.bookmarks.indexOf(bookmark), bookmark.id]
                            $('.edit-form').show()
                            $('.edit-form .name').focus()
                        },
                        saveBookmark: function(id, bookmark) {
                            var updatedBookmark = {
                                name: this.bookmarkForm.name,
                                url: this.bookmarkForm.url,
                            }
                            // update vue collection
                            app.bookmarks.$set(this.currentObjectInfo[0], updatedBookmark);
                            // update firebase collection
                            Bookmarks.child(this.currentObjectInfo[1]).set(updatedBookmark);
                            // reset vars
                            this.bookmarkForm.name = '';
                            this.bookmarkForm.url = '';
                            this.currentObjectInfo = [];
                            $('.edit-form').hide();
                        },
                        removeBookmark: function(bookmark) {
                            return Bookmarks.child(bookmark.id).remove()
                        },
                        bookmarkCurrentPage: function() {
                            Bookmarks.push({
                                name: currentTitle,
                                url: currentUrl
                            })
                        },
                        openNewTab: function(bookmark) {
                            chrome.tabs.create({ url: bookmark.url, active: true })
                        },
                        openFirstResult: function() {
                            var url = $('ul li.bookmark:nth-child(1) span a').attr('title');
                            this.openNewTab({ url: url })
                        }
                    }
                }) // end of vue App

            } // end of useToken
        }) // end of chrome.storage.sync
    }) // end of chrome.tabs.query
} // end of onload