# OpenTok proctoring demo

A simple OpenTok demo showing a proctoring setup where each participant publishes 3 video feeds simultaneously.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kaustavdm/opentok-lms-demos/tree/proctoring)

## Features

### Roles

- Proctor: Moderator, subscribe only (Only subscribes to students’ streams)
- Students: Publish only

### Students

- Students publish 2 camera feeds and 1 screen feed
- Students join and start publishing their feed
- Students do not subscribe to proctor or to each other

### Proctor

- Sees multiple students displayed in a thumbnail grid
- Click on each student feed to maximize

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