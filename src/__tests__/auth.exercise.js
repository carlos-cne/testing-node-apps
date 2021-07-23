// Testing Authentication API Routes

import axios from 'axios';
import { resetDb } from 'utils/db-utils';
import * as generate from 'utils/generate';
import { getData, handleRequestFailure, resolve } from 'utils/async';
import * as usersDB from '../db/users';
import startServer from '../start';

// 🐨 you'll need to start/stop the server using beforeAll and afterAll
// 💰 This might be helpful: server = await startServer({port: 8000})

// 🐨 beforeEach test in this file we want to reset the database

const baseURL = 'http://localhost:8000/api';
const api = axios.create({ baseURL });

api.interceptors.response.use(getData, handleRequestFailure);

let server;

beforeAll(async () => {
  server = await startServer({ port: 8000 });
});

afterAll(() => server.close());

beforeEach(() => resetDb());

test('auth flow', async () => {
  // 🐨 get a username and password from generate.loginForm()
  const { username, password } = generate.loginForm();
  // register
  // 🐨 use axios.post to post the username and password to the registration endpoint
  // 💰 http://localhost:8000/api/auth/register
  const registerData = await api.post('auth/register', {
    username,
    password,
  });

  // 🐨 assert that the result you get back is correct
  // 💰 it'll have an id and a token that will be random every time.
  // You can either only check that `result.data.user.username` is correct, or
  // for a little extra credit 💯 you can try using `expect.any(String)`
  // (an asymmetric matcher) with toEqual.
  // 📜 https://jestjs.io/docs/en/expect#expectanyconstructor
  // 📜 https://jestjs.io/docs/en/expect#toequalvalue
  expect(registerData.user.id).toEqual(expect.any(String));
  expect(registerData.user.token).toEqual(expect.any(String));
  expect(registerData.user.username).toEqual(username);

  // login
  // 🐨 use axios.post to post the username and password again, but to the login endpoint
  // 💰 http://localhost:8000/api/auth/login
  const loginData = await api.post('auth/login', {
    username,
    password,
  });
  // 🐨 assert that the result you get back is correct
  // 💰 tip: the data you get back is exactly the same as the data you get back
  // from the registration call, so this can be done really easily by comparing
  // the data of those results with toEqual
  expect(loginData).toEqual(registerData);
  // authenticated request
  // 🐨 use axios.get(url, config) to GET the user's information
  // 💰 http://localhost:8000/api/auth/me
  // 💰 This request must be authenticated via the Authorization header which
  // you can add to the config object: {headers: {Authorization: `Bearer ${token}`}}
  // Remember that you have the token from the registration and login requests.
  const meData = await api.get('auth/me', {
    headers: { Authorization: `Bearer ${registerData.user.token}` },
  });
  // 🐨 assert that the result you get back is correct
  // 💰 (again, this should be the same data you get back in the other requests,
  // so you can compare it with that).

  expect(meData).toEqual(registerData);
});

test('username must be unique', async () => {
  const { username, password } = generate.loginForm();

  await usersDB.insert(generate.buildUser({ username }));

  await expect(
    api.post('auth/register', {
      username,
      password,
    }),
  ).rejects.toMatchInlineSnapshot(`[Error: 400: {"message":"username taken"}]`);
});

test('get me unauthenticated returns error', async () => {
  const error = await api.get('/auth/me').catch(resolve);

  expect(error).toMatchInlineSnapshot(
    `[Error: 401: {"code":"credentials_required","message":"No authorization token was found"}]`,
  );
});

test('username required to register', async () => {
  const error = await api
    .post('auth/register', { password: generate.password() })
    .catch(resolve);

  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username can't be blank"}]`,
  );
});

test('password required to register', async () => {
  await expect(
    api.post('auth/register', { username: generate.username() }),
  ).rejects.toMatchInlineSnapshot(
    `[Error: 400: {"message":"password can't be blank"}]`,
  );
});

test('username required to login', async () => {
  const error = await api
    .post('auth/login', { password: generate.password() })
    .catch(resolve);

  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username can't be blank"}]`,
  );
});

test('password required to login', async () => {
  await expect(
    api.post('auth/login', { username: generate.username() }),
  ).rejects.toMatchInlineSnapshot(
    `[Error: 400: {"message":"password can't be blank"}]`,
  );
});

test('user must exist to login', async () => {
  const error = await api
    .post('auth/login', generate.loginForm({ username: '__will_never_exit__' }))
    .catch(resolve);

  expect(error).toMatchInlineSnapshot(
    `[Error: 400: {"message":"username or password is invalid"}]`,
  );
});
