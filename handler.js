'use strict'
console.log('Loading function ...')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const AUTH_URL = process.env.AUTH_URL
const REALM = process.env.REALM

const credentials = {
  client: {
    id: CLIENT_ID,
    secret: CLIENT_SECRET
  },
  auth: {
    tokenHost: AUTH_URL,
    tokenPath: `/auth/realms/${REALM}/protocol/openid-connect/token`,
    revokePath: `/auth/realms/${REALM}/protocol/openid-connect/logout`,
    authorizePath: `/auth/realms/${REALM}/protocol/openid-connect/auth`
  }
}

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials)
const jwtDecode = require('jwt-decode');

module.exports.logger = (event, context, callback) => {
  const { body } = event

  if (body) {
    const req = JSON.parse(body)
    console.log(req)

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: JSON.stringify({
        ...{},
        // TODO this can be commented out
        req: req,
        input: event
      })
    }

    callback(null, response)
  } else {
    callback(new Error({ error: 'Failed' }))
  }
}

module.exports.auth = async (event, context, callback) => {
  const { body } = event

  if (body) {
    const req = JSON.parse(body)
    console.log(req)
    const { auth } = req
    const { localpart, password } = auth

    // Get the access token object.
    const tokenConfig = {
      username: localpart,
      password: password
      // scope: '<scope>', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    }

    // Save the access token
    try {
      const result = await oauth2.ownerPassword.getToken(tokenConfig)
        const {access_token} = result
        const {preferred_username,
            // sub,
            name,
            // email
      } = jwtDecode(access_token)
      // const accessToken = oauth2.accessToken.create(result)

      console.log(`result: ${JSON.stringify(result)}`)
      console.log(`accessToken: ${JSON.stringify(jwtDecode(access_token))}`)

      const authTrue = {
        'auth': {
          'success': true,
          'id': {
            'type': 'localpart',
            'value': preferred_username
          },
          'profile': {
            'display_name': name
          }
        }
      }

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*' // Required for CORS support to work
        },
        body: JSON.stringify({
          // ...authFalse,
          ...authTrue
          // TODO this can be commented out
          // req: req,
          // input: event,
        })
      }

      callback(null, response)
    } catch (error) {
        console.log('Access Token Error', error.message)
        console.error(error)

        const authFalse = {
          'auth': {
            'success': false
          }
        }

        const response = {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*' // Required for CORS support to work
          },
          body: JSON.stringify({
            ...authFalse
          })
        }

        callback(null, response)

    }
  } else {
    callback(new Error({ error: 'Body required' }))
  }
}
