import {UnauthorizedError} from 'express-jwt'
import {buildRes, buildNext} from 'utils/generate'
import errorMiddleware from '../error-middleware'
// Testing Middleware

// 🐨 Write a test for the UnauthorizedError case
// 💰 const error = new UnauthorizedError('some_error_code', {message: 'Some message'})
// 💰 const res = {json: jest.fn(() => res), status: jest.fn(() => res)}

// 🐨 Write a test for the headersSent case

// 🐨 Write a test for the else case (responds with a 500)

describe('UnauthorizedError test cases', () => {
  it('should be able to return UnauthorizedError error', () => {
    const res = buildRes()
    const req = {}
    const next = jest.fn();
    const code = 'some_error_code'
    const message = 'Some message'
    const error = new UnauthorizedError(code, {
      message,
    })
    errorMiddleware(error, req, res, next)

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      code: error.code,
      message: error.message,
    })
    expect(res.json).toHaveBeenCalledTimes(1)
  })

  it('should be able to call next func if res have headersSent', () => {
    const res = buildRes({ headersSent: true })
    const next = buildNext()
    const error = new Error('error')
    const req = {}
    errorMiddleware(error, req, res, next)

    expect(next).toHaveBeenCalledWith(error);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  })

  it('should able to return the default error if does not have headersSent nor instanceOf UnauthorizedError', () => {
    const res = buildRes()
    const error = new Error('error')
    const next = jest.fn();
    const req = {};
    errorMiddleware(error, req, res, null)

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: error.message,
        stack: error.stack
      }),
    )
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
  })
})
