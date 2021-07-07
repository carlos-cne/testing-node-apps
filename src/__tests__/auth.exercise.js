// Testing Authentication API Routes

// 🐨 import the things you'll need
// 💰 here, I'll just give them to you. You're welcome
import axios from 'axios'
import {resetDb} from 'utils/db-utils'
import * as generate from 'utils/generate'
import startServer from '../start'

// 🐨 you'll need to start/stop the server using beforeAll and afterAll
// 💰 This might be helpful: server = await startServer({port: 8000})

// 🐨 beforeEach test in this file we want to reset the database

let server

beforeAll(async () => {
  server = await startServer({port: 8000})
})

afterAll(async () => {
  await server.close()
})

beforeEach(async () => {
  await resetDb()
})

test('auth flow', async () => {
  // 🐨 get a username and password from generate.loginForm()
  const credentials = generate.loginForm()
  // register
  // 🐨 use axios.post to post the username and password to the registration endpoint
  // 💰 http://localhost:8000/api/auth/register
  const {data} = await axios.post(
    'http://localhost:8000/api/auth/register',
    credentials,
  )

  // 🐨 assert that the result you get back is correct
  // 💰 it'll have an id and a token that will be random every time.
  // You can either only check that `result.data.user.username` is correct, or
  // for a little extra credit 💯 you can try using `expect.any(String)`
  // (an asymmetric matcher) with toEqual.
  // 📜 https://jestjs.io/docs/en/expect#expectanyconstructor
  // 📜 https://jestjs.io/docs/en/expect#toequalvalue
  expect(data.user.id).toEqual(expect.any(String))
  expect(data.user.token).toEqual(expect.any(String))
  expect(data.user.username).toEqual(credentials.username)

  // login
  // 🐨 use axios.post to post the username and password again, but to the login endpoint
  // 💰 http://localhost:8000/api/auth/login
  const {data: login} = await axios.post(
    'http://localhost:8000/api/auth/login',
    credentials,
  )
  // 🐨 assert that the result you get back is correct
  // 💰 tip: the data you get back is exactly the same as the data you get back
  // from the registration call, so this can be done really easily by comparing
  // the data of those results with toEqual
  expect(login).toEqual(login)
  // authenticated request
  // 🐨 use axios.get(url, config) to GET the user's information
  // 💰 http://localhost:8000/api/auth/me
  // 💰 This request must be authenticated via the Authorization header which
  // you can add to the config object: {headers: {Authorization: `Bearer ${token}`}}
  // Remember that you have the token from the registration and login requests.
  const {data: me} = await axios.get('http://localhost:8000/api/auth/me', {
    headers: {Authorization: `Bearer ${data.user.token}`},
  })
  // 🐨 assert that the result you get back is correct
  // 💰 (again, this should be the same data you get back in the other requests,
  // so you can compare it with that).

  expect(me).toEqual(data)
})
