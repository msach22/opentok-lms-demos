/* global OT, room, chrome */

window.addEventListener('load', function studentController () {
  var session
  var publishers = {
    camera: null,
    screen: null
  }
  var stage = {}
  var students = {}

  function _msg (m) {
    $('#message').text(m)
  }

  function screenshot (subscriberid) {
    if (students[subscriberid]) {
      return 'data:image/png;base64,' + students[subscriberid].getImgData()
    }
    return null
  }

  function installChromeExtension () {
    var extUrl = 'https://chrome.google.com/webstore/detail/fbjkpogjjhklbffmfooofjgablhmcnhn'
    if (chrome && chrome.webstore) {
      chrome.webstore.install(extUrl, function () {
        $('#chrome-ext-install').hide()
        $('#share-screen').removeClass('invisible')
        _msg('Chrome screenshare extension installed')
      }, function (err) {
        console.log(err)
        _msg('Please install the screen sharing extension and refresh the page.')
      })
    }
  }

  function checkScreenShareSupport (callback) {
    OT.checkScreenSharingCapability(function (res) {
      var screenshareEnabled = false
      if (!res.supported || res.extensionRegistered === false) {
        _msg('Screensharing is not supported')
      } else if (res.extensionRequired === 'chrome' && res.extensionInstalled === false) {
        console.log('Chrome Screenshare required')
        $('#chrome-ext-install').show()
        $('#start-screen').hide()
      } else {
        console.log('Screenshare available')
        $('#chrome-ext-install').hide()
        $('#start-screen').show()
        screenshareEnabled = true
      }
      // Trigger callback
      callback(screenshareEnabled, res)
    })
  }

  function launchSession (data) {
    session = OT.initSession(data.apiKey, data.sessionId)

    function createPublisherScreenshare (evt) {
      evt.preventDefault()
      var opts = {
        audioSource: null,
        insertMode: 'append',
        publishAudio: false,
        videoSource: 'screen',
        width: '100%',
        height: '100%',
        name: 'Teacher screen'
      }

      _msg('Setting up screenshare...')

      publishers.screen = OT.initPublisher('teacher-screen', opts, function (err) {
        if (err) {
          console.log(err)
          _msg('Error getting access to screen share.')
          return
        }
        _msg('Screen sharing started.')
        $('#start-screen').attr('disabled', 'disabled')
        $('#publish').removeAttr('disabled')
      })
      $('input[type=radio][name=videoType]').attr('disabled', 'disabled')

      publishers.screen.on('mediaStopped', function () {
        publishers.screen = null
        $('#start-screen').removeAttr('disabled')
        _msg('Screen sharing stopped')
      })
      return false
    }

    function createPublisherCamera (evt) {
      evt.preventDefault()
      var opts = {
        insertMode: 'append',
        // publishAudio: true,
        // videoSource: 'camera',
        width: '100%',
        height: '100%',
        name: 'Teacher camera'
      }
      publishers.camera = OT.initPublisher('teacher-camera', opts, function (err) {
        if (err) {
          console.log(err)
          _msg('Error getting access to camera.')
          return
        }
        $('#start-camera').attr('disabled', 'disabled')
        $('#publish').removeAttr('disabled')
      })
      return false
    }

    $('#start-screen').on('click', createPublisherScreenshare)

    $('#start-camera').on('click', createPublisherCamera)

    $('#chrome-ext-install').on('click', function (evt) {
      evt.preventDefault()
      installChromeExtension()
      return false
    })

    $('#students').on('click', '.screenshot', function (evt) {
      var imgdata = screenshot(evt.target.dataset.streamid)
      if (imgdata != null) {
        var l = document.createElement('a')
        l.setAttribute('href', imgdata)
        l.setAttribute('download', 'screenshot-' + Date.now() + '.png')
        l.click()
      }
      return false
    })

    $('#students').on('click', 'button.fullscreen', function (evt) {
      var elm = evt.target.parentNode.parentNode
      if (elm.requestFullscreen) {
        elm.requestFullscreen()
      } else if (elm.webkitRequestFullScreen) {
        elm.webkitRequestFullScreen()
      } else if (elm.mozRequestFullScreen) {
        elm.mozRequestFullScreen()
      }
    })

    $('#publish').on('click', function (evt) {
      evt.preventDefault()
      if (publishers.camera != null) {
        session.publish(publishers.camera, function (err) {
          if (err) {
            _msg('Unable to publish camera')
            console.log(err)
            return
          }
          $('#publish').attr('disabled', 'disabled')
          console.log('Published camera')
          _msg('Live')
        })
      }
      if (publishers.screen != null) {
        session.publish(publishers.screen, function (err) {
          if (err) {
            _msg('Unable to publish screen')
            console.log(err)
            return
          }
          $('#publish').attr('disabled', 'disabled')
          console.log('Published screen')
          _msg('Live')
        })
      }
      return false
    })

    function subscribe (stream, connId) {
      var innerhtml = '<div id="stream-' + stream.id + '" class="stream type-' + stream.videoType + '">' +
        '<div class="action-buttons">' +
          '<button type="button" class="btn btn-secondary fullscreen">Zoom</button>' +
          '<button type="button" class="btn btn-secondary screenshot" data-streamid="' + stream.id + '">Screenshot</button>' +
        '</div>' +
      '</div>'
      $('#conn' + connId).append(innerhtml)
      var s = session.subscribe(stream, 'stream-' + stream.id, {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      }, function (err) {
        if (err) {
          alert('Error subscribing to stream')
          console.log(err)
          return
        }
        console.log('Subscribed to stream ' + stream.id + ' of connection ' + connId)
      })
      s.subscribeToVideo(true)
      s.subscribeToAudio(false)
      students[stream.id] = s
    }

    session.on('streamDestroyed', function (event) {
      console.log('Stream destroyed', event)
      students[event.stream.id] = null
      $('#stream-' + event.stream.id).remove()
    })

    session.on('connectionDestroyed', function (event) {
      console.log('Connection destroyed', event)
    })

    session.on('streamCreated', function (event) {
      console.log('Stream created', event)
      try {
        var data = JSON.parse(event.stream.connection.data)
        if (data.userType === 'student') {
          subscribe(event.stream, data)
        }
      } catch (e) {
        console.log('Error subscribing to stream', e)
        _msg('Error subscribing to stream')
      }
    })

    session.connect(data.token, function (error) {
      if (error) {
        alert('Error connecting to OpenTok session')
        _msg('Error')
        console.log(error)
        return
      }
      console.log('Connected to session', data.sessionId)
      _msg('Connected to OpenTok')
    })
  }

  $.get('/token/' + room.roomId + '/teacher', function (data) {
    OT.registerScreenSharingExtension('chrome', 'fbjkpogjjhklbffmfooofjgablhmcnhn', 2)
    checkScreenShareSupport(function () {
      launchSession(data)
    })
  }, 'json')
    .fail(function (err) {
      _msg('Error getting token')
      console.log(err)
    })
})
