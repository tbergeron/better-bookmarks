window.onload = function() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var currentUrl = tabs[0].url
        var currentTitle = tabs[0].title
        var baseURL = 'https://bbtestdb.firebaseio.com/'
        var Bookmarks = new Firebase(baseURL + 'bookmarks')

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
                }
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
                }
            }
        }) // end of vue App

    })
}