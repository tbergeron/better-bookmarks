var baseURL = 'https://bbtestdb.firebaseio.com/'
var Users = new Firebase(baseURL + 'users')

Users.on('child_added', function(snapshot) {
    var item = snapshot.val()
    item.id = snapshot.key()
    app.users.push(item)
})

Users.on('child_removed', function(snapshot) {
    var id = snapshot.key()
    app.users.some(function(user) {
        if (user.id === id) {
            app.users.$remove(user)
            return true
        }
    })
})

var app = new Vue({
    // element to mount to
    el: '#app',
    // initial data
    data: {
        users: [],
        newUser: {
            name: '',
            email: ''
        }
    },
    // computed property for form validation state
    computed: {
        validation: function() {
            return {
                name: !!this.newUser.name.trim(),
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
        addUser: function() {
            if (this.isValid) {
                Users.push(this.newUser)
                this.newUser.name = ''
                this.newUser.email = ''
            }
        },
        removeUser: function(user) {
            new Firebase(baseURL + 'users/' + user.id).remove()
        }
    }
})