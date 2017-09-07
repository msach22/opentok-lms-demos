/* global OT */

window.addEventListener('load', function studentController () {
  var session
  var publisher
  var id = window.location.hash.slice(1)
  var msg = $('#message')

  function launchSession (data) {
    session = OT.initSession(data.apiKey, data.sessionId)

    session.on('streamCreated', function (event) {
      console.log('streamCreated', event)
      if (event.stream.connection.data === id) {
        session.subscribe(event.stream, 'other-sources', {
          insertMode: 'append',
          width: '200px',
          height: '150px'
        })
      }
    })

    session.connect(data.token, function (error) {
      if (error) {
        alert('Error connecting to OpenTok session')
        msg.text('Error')
        console.log(error)
        return
      }
      console.log('Connected to session', data.sessionId)
      msg.text('Connected to OpenTok')
      $('.start-camera').removeAttr('disabled')

      $('#start-camera').on('click', function (evt) {
        publisher = OT.initPublisher('camera-view', {
          audioSource: null,
          videoSource: $('#camera-list').val(),
          height: '100%',
          width: '100%',
          insertMode: 'append',
          name: $('#camera-name').val()
        }, function (err) {
          if (err) {
            alert('Error getting feed for camera 1')
            console.log(err)
            return
          }
          $('#publish').removeAttr('disabled')
          $('.camera').attr('disabled', 'disabled')
        })
      })

      $('#publish').on('click', function (evt) {
        session.publish(publisher, function (err) {
          if (err) {
            alert('Unable to publish camera 1')
            console.log(err)
            return
          }
          $('#publish').attr('disabled', 'disabled')
          console.log('Published camera')
          msg.text('Live')
        })
      })
    })
  }

  OT.getDevices(function (err, devices) {
    if (err) {
      alert('Error getting list of media devices')
      console.log(err)
      return
    }
    console.log('MediaDevices', devices)
    if (devices.length < 1) {
      alert('No media devices available')
      console.error('No media devices available')
      return
    }

    var videoDevices = devices.filter(function (d) {
      return d.kind === 'videoInput'
    }).map(function (d, i) {
      var deviceLabel = d.label.replace(/_/g, ' ').split(' (')[0] || 'Camera ' + (i + 1)
      return '<option value="' + d.deviceId + '">' + deviceLabel + '</option>'
    })

    $('#camera-list').append(videoDevices.join(''))

    $.get('/token?id=' + id, function (data) {
      console.log('Token data', data)
      window.location.hash = data.id
      $('#share-url').val(window.location.href)
      launchSession(data)
    }, 'json')
      .fail(function (err) {
        alert('Error getting token')
        console.log(err)
      })
  })
})
