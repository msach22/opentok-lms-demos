# OpenTok tutoring demo

A simple OpenTok demo showing a tutoring setup where 1 teacher is connected to N students in a classroom. Students see only the teacher. Teacher can bring any student on the "stage" so that other students see and hear that student. Students also have a breakout room where they can discuss among each other.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kaustavdm/opentok-lms-demos/tree/tutoring)

## Features

### Roles

- Teacher: Moderator - Publishes camera and/or screen.
- Students: Publish only

### Students

- Students publish their camera
- Students subscribe to the teacher and any other student who has been brought on stage.
- Students do not subscribe to proctor or to each other.

### Teacher

- Teacher publishes their camera and/or screen.
- Sees multiple students displayed in a thumbnail grid
- Can add or remove students on stage.

### Breakout room

- Students can temporarily leave the classroom and enter a breakout room
- Breakout room can handle max 5 students in full-mesh in this demo.
- Students can get back to the classroom from the breakout room.

## Install

Install NodeJS v8.0+

Install dependencies with `npm`

```sh
$ npm install
```

Get OpenTok API keys and set them as environment variables:

```sh
$ export OPENTOK_API_KEY="opentok-api-key-here"
$ export OPENTOK_API_SECRET="opentok-api-secret-here"
```
Start the server:

```sh
$ npm start
```

This will start the application on port `8080`. To change port, set the `PORT` environment variable. For example, to start the application on port `3000`, do this:

```sh
$ PORT=3000 npm start
```

To start secure server, set the `SECURE` environment variable to some value. For example, this will start the application on HTTPS port 3000:

```sh
$ SECURE=1 PORT=3000 npm start
```
