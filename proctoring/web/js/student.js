/* global OT */

window.addEventListener('load', function studentController () {
  var session
  var camCount = 0;
  var publishers = {
    camera1: null,
    camera2: null,
    screen: null
  }
  var msg = $('#message')

  function launchSession (data) {
    session = OT.initSession(data.apiKey, data.sessionId)
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

      $('#start-camera1').on('click', function (evt) {
        publishers.camera1 = OT.initPublisher('camera1-view', {
          audioSource: null,
          videoSource: $('#camera-list1').val(),
          height: '100%',
          width: '100%',
          insertMode: 'append',
          name: 'Camera 1'
        }, function (err) {
          if (err) {
            alert('Error getting feed for camera 1')
            console.log(err)
            return
          }
          camCount++
          if (camCount === 2) {
            $('#publish').removeAttr('disabled')
          }
          $('.camera1').attr('disabled', 'disabled')
        })
      })

      $('#start-camera2').on('click', function (evt) {
        publishers.camera2 = OT.initPublisher('camera2-view', {
          audioSource: null,
          videoSource: $('#camera-list2').val(),
          height: '100%',
          width: '100%',
          insertMode: 'append',
          name: 'Camera 2'
        }, function (err) {
          if (err) {
            alert('Error getting feed for camera 2')
            console.log(err)
            return
          }
          camCount++
          if (camCount === 2) {
            $('#publish').removeAttr('disabled')
          }
          $('.camera2').attr('disabled', 'disabled')
        })
      })

      $('#publish').on('click', function (evt) {
        session.publish(publishers.camera1, function (err) {
          if (err) {
            alert('Unable to publish camera 1')
            console.log(err)
            return
          }
          console.log('Published camera 1')
          session.publish(publishers.camera2, function (err) {
            if (err) {
              alert('Unable to publish camera2')
              console.log(err)
              return
            }
            console.log('Published camera 2')
            msg.text('Live')
          })
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

    $('#camera-list1').append(videoDevices.join(''))
    $('#camera-list2').append(videoDevices.join(''))

    $.get('/token', function (data) {
      launchSession(data)
    }, 'json')
      .fail(function (err) {
        alert('Error getting token')
        console.log(err)
      })
  })
})
