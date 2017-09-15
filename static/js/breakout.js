/* global OT, room, initLayoutContainer */

window.addEventListener('load', function studentController () {
  var session
  var publisher
  var layout = initLayoutContainer(document.getElementById('subscribers'))

  function _msg (m) {
    $('#message').html(m)
  }

  function launchSession (data) {
    console.log(data)
    session = OT.initSession(data.apiKey, data.breakoutSessionId)

    session.on('streamCreated', function (evt) {
      session.subscribe(evt.stream, 'subscribers', {
        insertMode: 'append'
      })
      layout.layout()
    })

    session.connect(data.token, function (err) {
      if (err) {
        _msg('Error connecting to OpenTok session')
        console.log(err)
        return
      }
      publisher = OT.initPublisher('self-view', {
        insertMode: 'append',
        width: '100%',
        height: '240px',
        resolution: '640x480',
        name: $('#user-name').val()
      }, function (err) {
        if (err) {
          console.log('Error creating publisher', err)
          _msg('Error creating publisher')
          return
        }
        session.publish(publisher, function (err) {
          if (err) {
            console.log('Error publishing to session', err)
            _msg('Error in publishing')
          }
          _msg('Live')
        })
      })
    })
  }

  OT.getDevices(function (err, devices) {
    if (err) {
      _msg('Error getting list of media devices')
      console.log(err)
      return
    }
    console.log('MediaDevices', devices)
    if (devices.length < 1) {
      _msg('No media devices available')
      console.error('No media devices available')
      return
    }
    $('#join-room').removeAttr('disabled')
    $('#join-room').on('click', function (evt) {
      evt.preventDefault()
      $.get('/token/' + room.roomId + '/breakout?name=' + $('#user-name').val(), function (data) {
        console.log('Token data', data)
        $('#join-form').hide()
        launchSession(data)
      }, 'json')
        .fail(function (err) {
          _msg('Error getting token')
          console.log(err)
        })
      return false
    })
  })
})
