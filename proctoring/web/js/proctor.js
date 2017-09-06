/* global OT */

window.addEventListener('load', function studentController () {
  var session
  var connections = {}
  var subscribers = {}
  var studentsDiv = $('#students')
  var msg = $('#message')

  function launchSession (data) {
    session = OT.initSession(data.apiKey, data.sessionId)

    $('#students').on('click', 'button.zoom', function (evt) {
      evt.target.parentNode.classList.add('zoomed')
      evt.target.classList.add('zoomed')
      evt.target.classList.remove('zoom')
      evt.target.innerText = 'Exit'
      var connId = evt.target.dataset.connid
      if (!connections[connId]) {
        console.log('No streams available for connid', connId)
        return
      }
      subscribe(connections[connId][1], connId)
    })

    $('#students').on('click', 'button.zoomed', function (evt) {
      unsubscribe(evt.target.dataset.connid)
      evt.target.parentNode.classList.remove('zoomed')
      evt.target.classList.remove('zoomed')
      evt.target.classList.add('zoom')
      evt.target.innerText = 'Zoom'
    })

    function unsubscribe (connId) {
      var streamId = connections[connId][1].id
      console.log('Unsubscribing', subscribers[streamId])
      if (subscribers[streamId]) {
        session.unsubscribe(subscribers[streamId])
      }
      $('#stream' + streamId).remove()
    }

    function subscribe (stream, connId) {
      $('#conn' + connId).append('<div id="stream' + stream.id + '"></div>')
      var s = session.subscribe(stream, 'stream' + stream.id, {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        fitMode: 'cover'
      }, function (err) {
        if (err) {
          alert('Error subscribing to stream')
          console.log(err)
          return
        }
        console.log('Subscribed to stream ' + stream.id + ' of connection ' + connId)
      })
      subscribers[stream.id] = s
    }

    session.on('streamDestroyed', function (event) {
      console.log('Session destroyed', event)
      $('#stream' + event.stream.id).remove()
    })

    session.on('connectionDestroyed', function (event) {
      console.log('Connection destroyed', event)
      $('#conn' + event.connection.connectionId).remove()
    })

    session.on('streamCreated', function (event) {
      console.log('Stream created', event)
      var connId = event.stream.connection.id || event.stream.connection.connectionId
      if (!connections[connId]) {
        connections[connId] = []
        studentsDiv.append('<div id="conn' + connId + '"><button class="zoom" data-connid="' + connId + '">Zoom</button></div>')
        subscribe(event.stream, connId)
      }
      connections[connId].push(event.stream)
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
    })
  }

  $.get('/token', function (data) {
    launchSession(data)
  }, 'json')
    .fail(function (err) {
      alert('Error getting token')
      console.log(err)
    })
})
