$(document).ready(function(){
  //initialize the firebase app
  var config = {
    apiKey: "AIzaSyD-o7jL_hIbKV2Tmb0yC_83f4dJUvJkOwY",
    authDomain: "notes-1272d.firebaseapp.com",
    databaseURL: "https://notes-1272d.firebaseio.com",
    projectId: "notes-1272d",
    storageBucket: "notes-1272d.appspot.com",
    messagingSenderId: "636771127992",
    appId: "1:636771127992:web:ebb27768fe402a5f2e1a4d",
    measurementId: "G-5CTDFQW3SZ"
  };
  firebase.initializeApp(config);

  //create firebase referencesT
  var Auth = firebase.auth(); 
  var dbRef = firebase.database();
  var notesRef = dbRef.ref('notes')
  var usersRef = dbRef.ref('users')
  var auth = null;

  //Register
  $('#registerForm').on('submit', function (e) {
    e.preventDefault();
    $('#registerModal').modal('hide');
    $('#messageModalLabel').html(spanText('<i class="fa fa-cog fa-spin"></i>', ['center', 'info']));
    $('#messageModal').modal('show');
    var data = {
      email: $('#registerEmail').val(), //get the email from Form
      firstName: $('#registerFirstName').val(), // get firstName
      lastName: $('#registerLastName').val(), // get lastName
    };
    var passwords = {
      password : $('#registerPassword').val(), //get the pass from Form
      cPassword : $('#registerConfirmPassword').val(), //get the confirmPass from Form
    }
    if( data.email != '' && passwords.password != ''  && passwords.cPassword != '' ){
      if( passwords.password == passwords.cPassword ){
        //create the user
        
        firebase.auth()
          .createUserWithEmailAndPassword(data.email, passwords.password)
          .then(function(user) {
            return user.updateProfile({
              displayName: data.firstName + ' ' + data.lastName
            })
          })
          .then(function(user){
            //now user is needed to be logged in to save data
            auth = user;
            //now saving the data
            usersRef.child(user.uid).set(data)
              .then(function(){
                console.log("User Information Saved:", user.uid);
              })
            $('#messageModalLabel').html(spanText('Success!', ['center', 'success']))
            
            $('#messageModal').modal('hide');
          })
          .catch(function(error){
            console.log("Error creating user:", error);
            $('#messageModalLabel').html(spanText('ERROR: '+error.code, ['danger']))
            if (error.code == undefined) {
              $('#messageModalLabel').html(spanText('Successfully registered, now please login.', ['success']))
            }
            else if (error.code == 'auth/email-already-in-use'){
              $('#messageModalLabel').html(spanText('You have already registered please login!', ['danger']))
            }
          });
      } else {
        //password and confirm password didn't match
        $('#messageModalLabel').html(spanText("ERROR: Passwords didn't match", ['danger']))
      }
    }  
  });

  //Login
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    $('#loginModal').modal('hide');
    $('#messageModalLabel').html(spanText('<i class="fa fa-cog fa-spin"></i>', ['center', 'info']));
    $('#messageModal').modal('show');

    if( $('#loginEmail').val() != '' && $('#loginPassword').val() != '' ){
      //login the user
      var data = {
        email: $('#loginEmail').val(),
        password: $('#loginPassword').val()
      };
      firebase.auth().signInWithEmailAndPassword(data.email, data.password)
        .then(function(authData) {
          auth = authData;
          $('#messageModalLabel').html(spanText('Success!', ['center', 'success']))
          $('#messageModal').modal('hide');
        })
        .catch(function(error) {
          console.log("Login Failed!", error);
          $('#messageModalLabel').html(spanText('ERROR: '+error.code, ['danger']))
          if (error.code == 'auth/user-not-found'){
            $('#messageModalLabel').html(spanText('You have not entered your correct email-Id.', ['danger']))
          }
          else if (error.code == 'auth/wrong-password'){
            $('#messageModalLabel').html(spanText('Your password is incorrect!', ['danger']))
          }
        });
    }
  });

  $('#logout').on('click', function(e) {
    e.preventDefault();
    firebase.auth().signOut()
  });

  //save note
  $('#noteForm').on('submit', function( event ) {  
    event.preventDefault();
    if( auth != null ){
      if( $('#name').val() != '' || $('#email').val() != '' ){
        notesRef.child(auth.uid)
          .push({
            title: $('#title').val(),
            note: $('#note').val(),
          })
          document.noteForm.reset();
      } else {
        alert('Please enter the title and note!');
      }
    } else {
      //inform user to login
    }
  });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      auth = user;
      $('body').removeClass('auth-false').addClass('auth-true');
      usersRef.child(user.uid).once('value').then(function (data) {
        var info = data.val();
        if(user.photoUrl) {
          $('.user-info img').show();
          $('.user-info img').attr('src', user.photoUrl);
          $('.user-info .user-name').hide();
        } else if(user.displayName) {
          $('.user-info img').hide();
          $('.user-info').append('<span class="user-name">'+user.displayName+'</span>');
        } else if(info.firstName) {
          $('.user-info img').hide();
          $('.user-info').append('<span class="user-name">'+info.firstName+'</span>');
        }
      });
      notesRef.child(user.uid).on('child_added', onChildAdd);
    } else {
      // No user is signed in.
      $('body').removeClass('auth-true').addClass('auth-false');
      auth && notesRef.child(auth.uid).off('child_added', onChildAdd);
      $('#notes').html('');
      auth = null;
    }
  });
});

function onChildAdd (snap) {
  $('#notes').append(noteHtmlFromObject(snap.key, snap.val()));
}
 
//prepare note object's HTML
function noteHtmlFromObject(key, note){
  return '<div class="card note" style="width: 18rem;" id="'+key+'">'
    + '<div class="card-body">'
      + '<h5 class="card-title">'+ "Title: " + note.title+'</h5>'
      + '<h6 class="card-subtitle mb-2 text-muted">'+ "Note: " + note.note+'</h6>'
      + '</p>'
      // + '<a href="#" class="card-link">Card link</a>'
      // + '<a href="#" class="card-link">Another link</a>'
    + '</div>'
  + '</div>';
}

function spanText(textStr, textClasses) {
  var classNames = textClasses.map(c => 'text-'+c).join(' ');
  return '<span class="'+classNames+'">'+ textStr + '</span>';
}
