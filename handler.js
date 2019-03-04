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

const base32 = require('base32')

const toBaseEncoding = (data)=>{

  // let buff = new Buffer(data);
  // const dataBase64 =  buff.toString('base64');
  // return dataBase64.replace(/=/g,'_')

  return base32.encode(data)

}

const fromBaseEncoding = (baseData)=>{
  // let data = base64.replace(/_/g,'=')
  // let buff = new Buffer(data, 'base64');
  // return buff.toString('ascii');
  return base32.decode(baseData)
}


const jwtDecode = require('jwt-decode');
const addrs = require("email-addresses");

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

module.exports.directory = async (event, context, callback) => {
  const {body} = event


  const empty = ()=>{
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: JSON.stringify({
        limited: false,
        results: []
      })
    }

    callback(null, response)
  }

  if (body) {
    const req = JSON.parse(body)
    console.log(req)

    if (req.by === 'name' && req.search_term==='vitaliy2'){

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*' // Required for CORS support to work
        },
        body: JSON.stringify({
          limited: false,
          results: [
            {
              display_name: "Abc ZZZ",
              user_id: toBaseEncoding('vitaliy2|mv-vpa.com')
            }
          ]
        })
      }

      callback(null, response)


    }else {
      empty()
    }
  }else {
    empty()
  }




}

module.exports.single_3PID_lookup = async (event, context, callback) => {
  const { body } = event;
  if (body) {
    const req = JSON.parse(body)
    console.log(req)
    const { lookup } = req
    const { medium, address } = lookup

    const emailObj = addrs.parseOneAddress(address)
    // const {parts} = emailObj

    console.log(JSON.stringify(emailObj))

    const base64data = toBaseEncoding(`${emailObj.local}|${emailObj.domain}`)

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: JSON.stringify({
        lookup: {
          ...lookup,
          id: {
            type: 'mxisd',
            value: `@${base64data}:${emailObj.domain}`
          }
        }
      })
    }

    callback(null, response)



  }else {
    callback(new Error({ error: 'Body required' }))
  }


}

module.exports.auth = async (event, context, callback) => {
  const { body } = event

// Initialize the OAuth2 Library
    const oauth2 = require('simple-oauth2').create(credentials)

  if (body) {
    const req = JSON.parse(body)
    console.log(req)
    const { auth } = req
    const { localpart, password } = auth
    const data = fromBaseEncoding(localpart)
    const localpartArr = data.split('|')

    console.log(data)
    console.log(localpartArr)

    // Get the access token object.
    const tokenConfig = {
      // username: localpart,
      username: `${localpartArr[0]}@${localpartArr[1]}`,
      password: password
      // scope: '<scope>', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    }

    console.log(`tokenConfig: ${JSON.stringify(tokenConfig)}`)

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
            'value': localpart
            // 'value': localpartArr[0]
            // 'value': `${localpartArr[0]}.${localpartArr[1]}`
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
