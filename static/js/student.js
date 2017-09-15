/* global OT, room */

window.addEventListener('load', function studentController () {
  var session
  var publisherCamera
  var students = {}

  function _msg (m) {
    $('#message').text(m)
  }

  function launchSession (data) {
    session = OT.initSession(data.apiKey, data.sessionId)

    function subscribeTeacherCamera (stream) {
      session.subscribe(stream, 'teacher-camera', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      }, function (err) {
        if (err) {
          console.log('Error subscribing to teacher\'s camera stream', err)
          _msg('Error subscribing to teacher\'s camera stream')
          $('#teacher-camera').addClass('has-stream')
        }
      })
    }

    function subscribeTeacherScreen (stream) {
      session.subscribe(stream, 'teacher-screen', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      }, function (err) {
        if (err) {
          console.log('Error subscribing to teacher\'s screen stream', err)
          _msg('Error subscribing to teacher\'s screen stream')
        }
        $('#teacher-screen').addClass('has-stream')
      })
    }

    function parseConnectionData (conn) {
      var data = null
      try {
        data = JSON.parse(conn.data)
        console.log('Parsed connection data', data)
      } catch (e) {
        console.log('Error parsing stream connection data', e)
      }
      return data
    }

    session.on('streamCreated', function (event) {
      console.log('streamCreated', event)
      var data = parseConnectionData(event.stream.connection)
      if (data == null) {
        return
      }
      if (data.userType === 'teacher') {
        switch (event.stream.videoType) {
          case 'camera':
            subscribeTeacherCamera(event.stream)
            break
          case 'screen':
            subscribeTeacherScreen(event.stream)
            break
        }
      } else if (data.userType === 'student') {
        students[event.stream.id] = event.stream
      }
    })

    session.on('streamDestroyed', function (event) {
      var data = parseConnectionData(event.stream.connection)
      if (data == null) {
        return
      }
      if (data.userType === 'teacher') {
        switch (event.stream.videoType) {
          case 'camera':
            $('#teacher-camera').removeClass('has-stream')
            break
          case 'screen':
            $('#teacher-screen').removeClass('has-stream')
        }
      } else if (data.userType === 'student') {
        students[event.stream.id] = null
        delete students[event.stream.id]
      }
    })

    session.connect(data.token, function (error) {
      if (error) {
        _msg('Error connecting to OpenTok session')
        console.log(error)
        return
      }
      console.log('Connected to session', data.sessionId)
      _msg('Connected to OpenTok')

      publisherCamera = OT.initPublisher('self-view', {
        resolution: '320x240',
        height: '100%',
        width: '100%',
        insertMode: 'append',
        name: $('#user-name').val()
      }, function (err) {
        if (err) {
          _msg('Error getting feed for camera 1')
          console.log(err)
          return
        }
        session.publish(publisherCamera, function (err) {
          if (err) {
            _msg('Unable to publish camera')
            console.log(err)
            return
          }
          console.log('Published camera')
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
      $.get('/token/' + room.roomId + '/student?name=' + $('#user-name').val(), function (data) {
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
