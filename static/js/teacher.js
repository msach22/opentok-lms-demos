/* global OT, room, chrome */

window.addEventListener('load', function studentController () {
  var session
  var publishers = {
    camera: null,
    screen: null
  }
  var stage = {}
  var students = {}
  var isLive = false

  function _msg (m) {
    $('#message').html(m)
  }

  function installChromeExtension () {
    var extUrl = 'https://chrome.google.com/webstore/detail/fbjkpogjjhklbffmfooofjgablhmcnhn'
    if (chrome && chrome.webstore) {
      chrome.webstore.install(extUrl, function () {
        $('#chrome-ext-install').hide()
        $('#start-screen').show()
        _msg('Chrome screenshare extension installed')
      }, function (err) {
        console.log(err)
        _msg('Please install the screen sharing from ' +
        '<a href="' + extUrl + '" target="_blank">this link</a> and reload this page')
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
        if (!isLive && publishers.camera == null) {
          $('#publish').attr('disabled', 'disabled')
        }
        _msg('Screen sharing stopped')
      })
      return false
    }

    function createPublisherCamera (evt) {
      evt.preventDefault()
      var opts = {
        insertMode: 'append',
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

    $('#publish').on('click', function (evt) {
      evt.preventDefault()
      if (publishers.camera != null) {
        session.publish(publishers.camera, function (err) {
          if (err) {
            _msg('Unable to publish camera')
            $('#start-camera').removeAttr('disabled')
            console.log(err)
            return
          }
          $('#start-camera').attr('disabled', 'disabled')
          $('#start-screen').attr('disabled', 'disabled')
          $('#publish').attr('disabled', 'disabled')
          console.log('Published camera')
          isLive = true
          _msg('Live')
        })
      }
      if (publishers.screen != null) {
        session.publish(publishers.screen, function (err) {
          if (err) {
            _msg('Unable to publish screen')
            $('#start-screen').removeAttr('disabled')
            console.log(err)
            return
          }
          $('#start-camera').attr('disabled', 'disabled')
          $('#start-screen').attr('disabled', 'disabled')
          $('#publish').attr('disabled', 'disabled')
          console.log('Published screen')
          isLive = true
          _msg('Live')
        })
      }

      return false
    })

    $('#students').on('click', '.stage-add', function (evt) {
      evt.preventDefault()
      var streamId = evt.target.dataset.streamid
      var stream = students[streamId]
      console.log('Adding to stage', stream)
      if (stream) {
        session.signal({
          type: 'stageAdd',
          data: streamId
        }, function (err) {
          if (err) {
            _msg('Error broadcasting message of adding to stage')
            console.log(err)
            return
          }
          stream.subscribeToVideo(false)
          $('#students-on-stage').append('<div id="stage-' + streamId + '" class="stream stage-stream"> ' +
            '<div class="action-buttons">' +
              '<button class="btn btn-secondary stage-remove" ' +
                'data-streamid="' + streamId + '">Remove from stage</button>' +
              '</div>' +
            '</div>')
          $('#stage-' + streamId).append(stream.element)
          $('#stream-' + streamId).hide()
          stream.subscribeToAudio(true)
          stream.subscribeToVideo(true)
          stage[streamId] = stream
        })
      }
      return false
    })

    $('#students-on-stage').on('click', '.stage-remove', function (evt) {
      evt.preventDefault()
      var streamId = evt.target.dataset.streamid
      var stream = stage[streamId]
      console.log('Removing from stage', stream)
      if (stream) {
        session.signal({
          type: 'stageRemove',
          data: streamId
        }, function (err) {
          if (err) {
            _msg('Error broadcasting message of removing to stage')
            console.log(err)
            return
          }
          stream.subscribeToVideo(false)
          stream.subscribeToAudio(false)
          $('#stream-' + streamId).append(stream.element)
          $('#stream-' + streamId).show()
          stream.subscribeToAudio(false)
          stream.subscribeToVideo(true)
          $('#stage-' + streamId).remove()
          stage[streamId] = null
          delete stage[streamId]
        })
      }
      return false
    })

    function subscribe (stream, connId) {
      var innerhtml = '<div id="stream-' + stream.id + '" class="stream col-3 type-' + stream.videoType + '">' +
        '<div class="action-buttons">' +
          '<button type="button" class="btn btn-secondary stage-add" ' +
            'data-streamid="' + stream.id + '">Add to stage</button>' +
        '</div>' +
      '</div>'
      $('#students').append(innerhtml)
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
      stage[event.stream.id] = null
      $('#stream-' + event.stream.id).remove()
      $('#stage-' + event.stream.id).remove()
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
