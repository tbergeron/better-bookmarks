Vue.config.debug = true
var baseURL = 'https://bbtestdb.firebaseio.com/'

// todo: [x] add/delete bookmarks
// todo: [x] edit bookmarks
// todo: [x] open first result on enter keypress
// todo: [x] keybinding to quickly open extension
// todo: [x] star indicate if current page already bookmarked
// todo: [x] delete confirmation / cancel timer popup
// todo: [x] tags support
// todo: [ ] implement proper child_changed method

function getRandomToken() {
    var randomPool = new Uint8Array(32)
    crypto.getRandomValues(randomPool)
    var hex = ''
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16)
    }
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
                chrome.storage.sync.set({ userid: userid }, function() {
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
                //     console.log(snapshot)
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
                            url: currentUrl,
                            tags: ''
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
                        starClass: function() {
                            if (this.bookmarks) {
                                var result = ''
                                this.bookmarks.forEach(function(bookmark) {
                                    if (bookmark.url == currentUrl) {
                                        result = 'star-on'
                                    }
                                })
                                return result
                            }
                        }
                    },
                    // methods
                    methods: {
                        showSuccessIndicator: function() {
                            $('#success-indicator').fadeIn('slow', function() {
                                setTimeout(function() {
                                    $('#success-indicator').fadeOut('slow')
                                }, 1000)
                            })
                        },
                        editBookmark: function(bookmark) {
                            this.bookmarkForm.name = bookmark.name
                            this.bookmarkForm.url = bookmark.url
                            this.bookmarkForm.tags = bookmark.tags
                            this.currentObjectInfo = [app.bookmarks.indexOf(bookmark), bookmark.id]
                            $('.edit-form').show()
                            $('.edit-form .name').focus()
                        },
                        saveBookmark: function(id, bookmark) {
                            var updatedBookmark = {
                                id: this.currentObjectInfo[1],
                                name: this.bookmarkForm.name,
                                url: this.bookmarkForm.url,
                                tags: this.bookmarkForm.tags,
                            }
                            // update vue collection
                            app.bookmarks.$set(this.currentObjectInfo[0], updatedBookmark)
                            // update firebase collection
                            var that = this
                            Bookmarks.child(this.currentObjectInfo[1]).set(updatedBookmark, function() {
                                // reset vars
                                that.bookmarkForm.name = ''
                                that.bookmarkForm.url = ''
                                that.bookmarkForm.tags = ''
                                that.currentObjectInfo = []
                                $('.edit-form').hide()
                                that.showSuccessIndicator()
                            })
                        },
                        removeBookmark: function(bookmark) {
                            if (confirm('Are you sure to delete "' + bookmark.name + '"?')) {
                                Bookmarks.child(bookmark.id).remove()
                                this.showSuccessIndicator()
                            }
                        },
                        bookmarkCurrentPage: function() {
                            var already = false

                            this.bookmarks.forEach(function(bookmark) {
                                if (bookmark.url == currentUrl) {
                                    already = bookmark
                                }
                            })

                            if (already) {
                                this.removeBookmark(already)
                            } else {
                                Bookmarks.push({
                                    name: currentTitle,
                                    url: currentUrl,
                                    tags: ''
                                })
                            }
                            this.showSuccessIndicator()
                        },
                        openNewTab: function(bookmark) {
                            chrome.tabs.create({ url: bookmark.url, active: true })
                        },
                        openFirstResult: function() {
                            var url = $('ul li.bookmark:nth-child(1) span a').attr('title')
                            this.openNewTab({ url: url })
                        }
                    }
                }) // end of vue App

            } // end of useToken
        }) // end of chrome.storage.sync
    }) // end of chrome.tabs.query
} // end of onload