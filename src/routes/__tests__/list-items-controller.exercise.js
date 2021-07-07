import {
  buildBook,
  buildListItem,
  buildNext,
  buildReq,
  buildRes,
  buildUser,
} from 'utils/generate';
import * as booksDB from '../../db/books';
import * as listItemsDB from '../../db/list-items';
import * as listItemsController from '../list-items-controller';

jest.mock('../../db/books');
jest.mock('../../db/list-items');

describe('listItemsController use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getListItem returns the req.listItem', async () => {
    const user = buildUser();
    const book = buildBook();
    const listItem = buildListItem({ ownerId: user.id, bookId: book.id });

    booksDB.readById.mockResolvedValueOnce(book);

    const req = buildReq({ listItem });
    const res = buildRes();

    await listItemsController.getListItem(req, res);

    expect(booksDB.readById).toHaveBeenCalledWith(listItem.bookId);
    expect(booksDB.readById).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ listItem: { ...listItem, book } });
  });

  test('should return 400 if bookId was not provider', async () => {
    const req = buildReq();
    const res = buildRes();

    await listItemsController.createListItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No bookId provided",
        },
      ]
    `);
  });

  test('should setListItem sets the listItem', async () => {
    const res = buildRes();
    const user = buildUser();
    const listItem = buildListItem({ ownerId: user.id });
    const next = buildNext();
    const req = buildReq({
      user,
      params: { id: listItem.id },
    });

    listItemsDB.readById.mockResolvedValueOnce(listItem);

    await listItemsController.setListItem(req, res, next);

    expect(next).toHaveBeenCalledWith(/* nothing */);
    expect(listItemsDB.readById).toHaveBeenCalledTimes(1);
    expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id);
    expect(req.listItem).toBe(listItem);
  });

  test('should setListItem return 404 if no listItem', async () => {
    const res = buildRes();
    const next = buildNext();
    const req = buildReq({ params: { id: null } });

    listItemsDB.readById.mockResolvedValueOnce(null);

    await listItemsController.setListItem(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No list item was found with the id of null",
        },
      ]
    `);
  });

  test('should setListItem return 403 if no user.id and ownerId does not match', async () => {
    const res = buildRes();
    const user = buildUser({ id: '1' });
    const listItem = buildListItem({ id: '2' });
    const next = buildNext();
    const req = buildReq({
      user,
      params: { id: listItem.id },
    });

    listItemsDB.readById.mockResolvedValueOnce(listItem);

    await listItemsController.setListItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User with id 1 is not authorized to access the list item 2",
        },
      ]
    `);
  });
});
